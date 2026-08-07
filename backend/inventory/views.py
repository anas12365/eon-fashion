from django.db import models
from rest_framework import filters, mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from products.models import Product

from .models import InventoryHistory
from .serializers import InventoryHistorySerializer, InventoryProductSerializer


class InventoryViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    GET   /api/inventory/                 -> list products with stock info
                                              ?search=, ?low_stock=1, ?out_of_stock=1
    GET   /api/inventory/<id>/            -> retrieve one
    PATCH /api/inventory/<id>/            -> update stock and/or low_stock_threshold
                                              (writes an InventoryHistory row if stock changed)
    GET   /api/inventory/<id>/history/    -> that product's stock-change history
    GET   /api/inventory/history/         -> most recent stock changes across all products
    """

    queryset = Product.objects.all()
    serializer_class = InventoryProductSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'category']
    ordering_fields = ['stock', 'name', 'updated_at']

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get('out_of_stock') == '1':
            qs = qs.filter(stock=0)
        elif params.get('low_stock') == '1':
            qs = qs.filter(stock__gt=0, stock__lte=models.F('low_stock_threshold'))
        return qs

    def perform_update(self, serializer):
        old_quantity = serializer.instance.stock
        instance = serializer.save()
        if instance.stock != old_quantity:
            InventoryHistory.objects.create(
                product=instance,
                old_quantity=old_quantity,
                new_quantity=instance.stock,
                changed_by=self.request.user,
            )

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        product = self.get_object()
        qs = product.inventory_history.select_related('changed_by')
        page = self.paginate_queryset(qs)
        serializer = InventoryHistorySerializer(page or qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='history')
    def history_all(self, request):
        qs = InventoryHistory.objects.select_related('product', 'changed_by')[:200]
        serializer = InventoryHistorySerializer(qs, many=True)
        return Response(serializer.data)
