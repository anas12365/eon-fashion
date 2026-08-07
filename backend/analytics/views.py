"""
Phase 5.4 — Analytics Dashboard.

One read-only, admin-only endpoint that aggregates across Order,
OrderItem, and Product. No new model/migration — everything here is
computed from data the other apps already own, so there is nothing to
keep in sync and nothing that can drift from the real numbers.
"""
from decimal import Decimal

from django.db.models import Count, DecimalField, F, Sum
from django.db.models.functions import Coalesce
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order, OrderItem
from products.models import Product


def _decimal(value):
    return value if value is not None else Decimal('0')


class AnalyticsSummaryView(APIView):
    """
    GET /api/analytics/summary/
    {
      "revenue": "12345.00",          # sum of Order.total, excluding Cancelled
      "orders_count": 42,             # all orders, every status
      "orders_by_status": {"Pending": 3, "Confirmed": 1, ...},
      "customers_count": 17,          # distinct phone numbers across Order
      "products_count": 30,
      "visible_products_count": 27,
      "best_sellers": [
        {"product_id": 4, "product_name": "...", "quantity_sold": 12, "revenue": "600.00"},
        ...
      ]
    }
    """

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        orders = Order.objects.all()

        revenue = orders.exclude(status='Cancelled').aggregate(
            total=Coalesce(Sum('total'), Decimal('0'), output_field=DecimalField(max_digits=12, decimal_places=2))
        )['total']

        orders_by_status = {choice: 0 for choice, _ in Order.STATUS_CHOICES}
        for row in orders.values('status').annotate(count=Count('id')):
            orders_by_status[row['status']] = row['count']

        customers_count = orders.values('phone').distinct().count()
        products_count = Product.objects.count()
        visible_products_count = Product.objects.filter(visible=True).count()

        best_sellers = list(
            OrderItem.objects
            .exclude(order__status='Cancelled')
            .values('product_id', 'product_name')
            .annotate(
                quantity_sold=Sum('quantity'),
                revenue=Sum(F('unit_price') * F('quantity'), output_field=DecimalField(max_digits=12, decimal_places=2)),
            )
            .order_by('-quantity_sold')[:5]
        )

        return Response({
            'revenue': revenue,
            'orders_count': orders.count(),
            'orders_by_status': orders_by_status,
            'customers_count': customers_count,
            'products_count': products_count,
            'visible_products_count': visible_products_count,
            'best_sellers': best_sellers,
        })
