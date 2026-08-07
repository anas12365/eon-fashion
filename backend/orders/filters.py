import django_filters

from .models import Order


class OrderFilter(django_filters.FilterSet):
    """Backs the admin dashboard's status/date/customer filtering (API
    side). No matching UI control exists in admin/Orders.jsx yet — see
    the migration report — but the endpoint is ready for one.
    """

    date_from = django_filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    date_to = django_filters.DateFilter(field_name='created_at', lookup_expr='date__lte')
    customer = django_filters.CharFilter(field_name='customer_name', lookup_expr='icontains')

    class Meta:
        model = Order
        fields = ['status']
