"""
Phase 5.3 — Customer Management.

Important: there is no Customer/User-account model in this project — see
users/models.py ("admin-only authentication with no customer accounts").
Checkout only ever stores free-text `customer_name` / `phone` / `address`
on Order (orders/models.py). So "a customer" here is not a stored row
anywhere; it's every distinct phone number seen across Order, aggregated
on the fly. Building a real Customer model and backfilling/linking it to
Order would be a schema change and a second source of truth for the same
identity Order already carries — outside this phase's scope and contrary
to AI_RULES.md ("do not rebuild existing architecture"). If real customer
accounts are ever added, this module is exactly what would get replaced.

`phone` is therefore the identifier used to look up one customer's detail
and order history — not a database id.
"""
from decimal import Decimal

from django.db.models import Count, DecimalField, Max, Q, Sum
from django.db.models.functions import Coalesce
from rest_framework import generics, permissions, serializers
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from orders.serializers import OrderSerializer


class CustomerSerializer(serializers.Serializer):
    phone = serializers.CharField()
    name = serializers.CharField()
    address = serializers.CharField()
    # All orders ever placed with this phone number, including cancelled
    # ones — "how many times has this person ordered".
    orders_count = serializers.IntegerField()
    # Lifetime spend EXCLUDING cancelled orders — "how much has this
    # person actually paid/committed to", not what they abandoned.
    total_spent = serializers.DecimalField(max_digits=10, decimal_places=2)
    last_order_at = serializers.DateTimeField()


ORDERING_FIELDS = {
    'name', '-name',
    'orders_count', '-orders_count',
    'total_spent', '-total_spent',
    'last_order_at', '-last_order_at',
}


def _aggregate_customers(search=''):
    qs = Order.objects.all()
    if search:
        qs = qs.filter(Q(customer_name__icontains=search) | Q(phone__icontains=search))
    return qs.values('phone').annotate(
        name=Max('customer_name'),
        address=Max('address'),
        orders_count=Count('id'),
        total_spent=Coalesce(
            Sum('total', filter=~Q(status='Cancelled')),
            Decimal('0'),
            output_field=DecimalField(max_digits=10, decimal_places=2),
        ),
        last_order_at=Max('created_at'),
    )


class CustomerListView(generics.ListAPIView):
    """
    GET /api/customers/?search=&ordering=
    Supports ?search= (matches name or phone) and ?ordering= (one of
    name, orders_count, total_spent, last_order_at — prefix with "-" to
    reverse; defaults to most-recent-order first).
    """

    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        search = self.request.query_params.get('search', '').strip()
        ordering = self.request.query_params.get('ordering', '-last_order_at')
        if ordering not in ORDERING_FIELDS:
            ordering = '-last_order_at'
        return _aggregate_customers(search).order_by(ordering)


class CustomerDetailView(APIView):
    """
    GET /api/customers/<phone>/
    That phone number's aggregate (same shape as the list) plus its full
    order history, newest first, using the exact same OrderSerializer
    shape the admin Orders page already renders.
    """

    permission_classes = [permissions.IsAdminUser]

    def get(self, request, phone):
        orders = Order.objects.filter(phone=phone).prefetch_related('items', 'items__product')
        if not orders.exists():
            return Response({'detail': 'No customer found with that phone number.'}, status=404)

        # .first() on a grouped/annotated queryset requires an explicit
        # ordering in Django 5.x (it can't assume group order) — the
        # filter already narrows this to one row, so the ordering value
        # itself doesn't matter.
        agg = _aggregate_customers().filter(phone=phone).order_by('phone').first()
        data = CustomerSerializer(agg).data
        data['orders'] = OrderSerializer(orders, many=True).data
        return Response(data)
