"""
Phase 5.5 — Reports.

Four read-only, admin-only endpoints that aggregate across Order,
OrderItem, and Product. Same principle as analytics/ and customers/:
no new model, no migration, nothing here can drift from the real data
because nothing here is stored — it's all computed on read.

Reuses the existing date-range filter shape (`date_from` / `date_to`)
already used by orders/filters.py (OrderFilter), and the same "revenue
excludes Cancelled" convention already established in analytics/views.py.
"""
from datetime import datetime
from decimal import Decimal

from django.db.models import Count, DecimalField, F, Q, Sum
from django.db.models.functions import Coalesce, TruncDate
from django.utils.dateparse import parse_date
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order, OrderItem
from products.models import Product


def _decimal(value):
    return value if value is not None else Decimal('0')


def _date_range(request):
    """Shared ?date_from=&date_to= parsing (inclusive), same fields the
    admin Orders page already filters on via OrderFilter."""
    date_from = parse_date(request.query_params.get('date_from', '') or '')
    date_to = parse_date(request.query_params.get('date_to', '') or '')
    return date_from, date_to


def _apply_date_range(qs, date_from, date_to, field='created_at'):
    if date_from:
        qs = qs.filter(**{f'{field}__date__gte': date_from})
    if date_to:
        qs = qs.filter(**{f'{field}__date__lte': date_to})
    return qs


class SalesReportView(APIView):
    """
    GET /api/reports/sales/?date_from=&date_to=
    {
      "date_from": "2026-01-01" | null,
      "date_to": "2026-01-31" | null,
      "total_revenue": "12345.00",     // sum of Order.total, excludes Cancelled
      "orders_count": 42,              // non-cancelled orders in range
      "average_order_value": "293.93",
      "trend": [
        {"date": "2026-01-01", "revenue": "500.00", "orders_count": 3},
        ...
      ]
    }
    """

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        date_from, date_to = _date_range(request)
        orders = _apply_date_range(Order.objects.all(), date_from, date_to)
        counted = orders.exclude(status='Cancelled')

        total_revenue = counted.aggregate(
            total=Coalesce(Sum('total'), Decimal('0'), output_field=DecimalField(max_digits=12, decimal_places=2))
        )['total']
        orders_count = counted.count()
        average_order_value = (total_revenue / orders_count) if orders_count else Decimal('0')

        trend = list(
            counted
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(
                revenue=Coalesce(Sum('total'), Decimal('0'), output_field=DecimalField(max_digits=12, decimal_places=2)),
                orders_count=Count('id'),
            )
            .order_by('day')
        )
        trend = [
            {
                'date': row['day'].isoformat() if row['day'] else None,
                'revenue': row['revenue'],
                'orders_count': row['orders_count'],
            }
            for row in trend
        ]

        return Response({
            'date_from': date_from.isoformat() if date_from else None,
            'date_to': date_to.isoformat() if date_to else None,
            'total_revenue': total_revenue,
            'orders_count': orders_count,
            'average_order_value': round(average_order_value, 2),
            'trend': trend,
        })


class OrdersReportView(APIView):
    """
    GET /api/reports/orders/?date_from=&date_to=
    {
      "date_from": ..., "date_to": ...,
      "total_orders": 42,                          // all statuses, in range
      "status_breakdown": {"Pending": 3, ...},
      "completed_orders": 10,                       // status = Delivered
      "cancelled_orders": 5
    }
    """

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        date_from, date_to = _date_range(request)
        orders = _apply_date_range(Order.objects.all(), date_from, date_to)

        status_breakdown = {choice: 0 for choice, _ in Order.STATUS_CHOICES}
        for row in orders.values('status').annotate(count=Count('id')):
            status_breakdown[row['status']] = row['count']

        return Response({
            'date_from': date_from.isoformat() if date_from else None,
            'date_to': date_to.isoformat() if date_to else None,
            'total_orders': orders.count(),
            'status_breakdown': status_breakdown,
            'completed_orders': status_breakdown.get('Delivered', 0),
            'cancelled_orders': status_breakdown.get('Cancelled', 0),
        })


class InventoryReportView(APIView):
    """
    GET /api/reports/inventory/
    {
      "total_products": 30,
      "total_stock_units": 512,
      "inventory_value": "45678.00",   // sum(price * stock) across all products
      "low_stock_count": 4,
      "out_of_stock_count": 2,
      "low_stock_products": [
        {"id": 7, "name": "...", "category": "...", "stock": 2, "low_stock_threshold": 5},
        ...
      ]
    }
    """

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        products = Product.objects.all()

        totals = products.aggregate(
            total_stock_units=Coalesce(Sum('stock'), 0),
            inventory_value=Coalesce(
                Sum(F('price') * F('stock'), output_field=DecimalField(max_digits=14, decimal_places=2)),
                Decimal('0'),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            ),
        )

        out_of_stock_count = products.filter(stock=0).count()
        low_stock_qs = products.filter(stock__gt=0, stock__lte=F('low_stock_threshold'))

        low_stock_products = list(
            low_stock_qs.order_by('stock').values(
                'id', 'name', 'category', 'stock', 'low_stock_threshold'
            )
        )

        return Response({
            'total_products': products.count(),
            'total_stock_units': totals['total_stock_units'],
            'inventory_value': totals['inventory_value'],
            'low_stock_count': low_stock_qs.count(),
            'out_of_stock_count': out_of_stock_count,
            'low_stock_products': low_stock_products,
        })


class ProductPerformanceReportView(APIView):
    """
    GET /api/reports/products/?date_from=&date_to=&limit=
    {
      "date_from": ..., "date_to": ...,
      "products": [
        {"product_id": 4, "product_name": "...", "quantity_sold": 12, "revenue": "600.00"},
        ...
      ]
    }
    Ordered by quantity_sold descending. Cancelled orders are excluded —
    same convention as analytics/views.py best_sellers. `limit` defaults
    to 50 (0 or "all" returns everything).
    """

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        date_from, date_to = _date_range(request)

        items = OrderItem.objects.exclude(order__status='Cancelled')
        items = _apply_date_range(items, date_from, date_to, field='order__created_at')

        limit_param = request.query_params.get('limit', '50')
        qs = (
            items
            .values('product_id', 'product_name')
            .annotate(
                quantity_sold=Sum('quantity'),
                revenue=Sum(F('unit_price') * F('quantity'), output_field=DecimalField(max_digits=12, decimal_places=2)),
            )
            .order_by('-quantity_sold')
        )

        if limit_param not in ('0', 'all', ''):
            try:
                limit = int(limit_param)
                # A negative limit (e.g. ?limit=-5) parses fine as an int but
                # is not a valid slice bound on a Django QuerySet — qs[:-5]
                # raises AssertionError ("Negative indexing is not
                # supported"), which was an uncaught 500. Treat it the same
                # as an unparseable value: fall back to the existing safe
                # default of 50, same as the ValueError branch below.
                qs = qs[:limit] if limit > 0 else qs[:50]
            except ValueError:
                qs = qs[:50]

        return Response({
            'date_from': date_from.isoformat() if date_from else None,
            'date_to': date_to.isoformat() if date_to else None,
            'products': list(qs),
        })
