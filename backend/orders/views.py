from django.db import transaction
from django.db.models import F
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from django_filters.rest_framework import DjangoFilterBackend

from .filters import OrderFilter
from .models import Order
from .notifications import notify_order_cancelled, notify_status_change
from .serializers import OrderCreateSerializer, OrderSerializer, OrderStatusSerializer


class OrderPermission(permissions.BasePermission):
    """Mirrors the current firestore.rules: anyone can create an order
    (checkout has no login), but only an admin can list, read, or edit
    one afterward. `my_orders` is its own public lookup by phone number
    since there are no customer accounts to scope a "my orders" view to."""

    def has_permission(self, request, view):
        if view.action in ('create', 'my_orders'):
            return True
        return bool(request.user and request.user.is_staff)


class OrderViewSet(viewsets.ModelViewSet):
    """
    POST   /api/orders/                 -> create (public — checkout)
    GET    /api/orders/                 -> list (admin) — supports
                                            ?status=&date_from=&date_to=
                                            &customer=&search=&ordering=
    GET    /api/orders/<id>/            -> retrieve (admin)
    PATCH  /api/orders/<id>/status/     -> update status only (admin)
    PATCH  /api/orders/<id>/read/       -> mark read (admin)
    POST   /api/orders/<id>/cancel/     -> cancel + restock (admin)
    GET    /api/orders/my-orders/?phone=01234... -> public, filtered by
                                            phone (no customer accounts
                                            exist, so phone number is the
                                            only thing that scopes this)
    """

    queryset = Order.objects.all().prefetch_related('items', 'items__product')
    permission_classes = [OrderPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OrderFilter
    search_fields = ['customer_name', 'phone', 'display_id']
    ordering_fields = ['created_at', 'total']

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        order = self.get_object()
        old_status = order.status
        serializer = OrderStatusSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data.get('status', old_status)

        with transaction.atomic():
            serializer.save()
            if new_status == 'Cancelled' and old_status != 'Cancelled':
                _restock(order)
            elif old_status == 'Cancelled' and new_status != 'Cancelled':
                # Cancelled is terminal in ALLOWED_TRANSITIONS, so this
                # branch can't be reached through this endpoint anymore —
                # kept as a safety net in case a status is ever changed
                # by another path (e.g. the Django admin's list_editable
                # status field, which does not go through validate_status;
                # see the Phase 5.2 change report for this known gap).
                _destock(order)

        if new_status != old_status:
            notify_status_change(order, old_status, new_status)
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['patch'], url_path='read')
    def mark_read(self, request, pk=None):
        order = self.get_object()
        order.read = True
        order.save(update_fields=['read'])
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """Shortcut for PATCH .../status/ {"status": "Cancelled"} — same
        transition rules apply (see Order.ALLOWED_TRANSITIONS), so this
        no longer cancels an order that's already Shipped/Delivered.
        Already-Cancelled stays a no-op rather than an error, so calling
        this twice (e.g. a double-click) is harmless."""
        order = self.get_object()
        if order.status == 'Cancelled':
            return Response(OrderSerializer(order).data)
        if not order.can_transition_to('Cancelled'):
            return Response(
                {'detail': f'Cannot cancel an order that is already "{order.status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            old_status = order.status
            order.status = 'Cancelled'
            order.save(update_fields=['status'])
            _restock(order)
        notify_status_change(order, old_status, 'Cancelled')
        notify_order_cancelled(order)
        return Response(OrderSerializer(order).data)

    @action(detail=False, methods=['get'], url_path='my-orders')
    def my_orders(self, request):
        phone = request.query_params.get('phone', '').strip()
        if not phone:
            return Response(
                {'detail': 'A phone number is required, e.g. ?phone=0100...'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        orders = Order.objects.filter(phone=phone).prefetch_related('items')
        return Response(OrderSerializer(orders, many=True).data)


def _restock(order):
    """Returns each item's quantity back to its product's stock. Used
    when an order is cancelled. Products deleted since the order was
    placed (item.product is None) have nothing to restock."""
    for item in order.items.select_related('product').filter(product__isnull=False):
        item.product.__class__.objects.filter(pk=item.product_id).update(
            stock=F('stock') + item.quantity
        )


def _destock(order):
    """Reverses a restock if a cancelled order is reopened. Not clamped
    to 0 on purpose — a negative stock here is a real signal (the item
    sold out again while the order was cancelled) that shows up in the
    admin instead of silently disappearing."""
    for item in order.items.select_related('product').filter(product__isnull=False):
        item.product.__class__.objects.filter(pk=item.product_id).update(
            stock=F('stock') - item.quantity
        )
