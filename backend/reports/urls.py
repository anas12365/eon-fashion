from django.urls import path

from .views import (
    InventoryReportView,
    OrdersReportView,
    ProductPerformanceReportView,
    SalesReportView,
)

urlpatterns = [
    path('sales/', SalesReportView.as_view(), name='reports-sales'),
    path('orders/', OrdersReportView.as_view(), name='reports-orders'),
    path('inventory/', InventoryReportView.as_view(), name='reports-inventory'),
    path('products/', ProductPerformanceReportView.as_view(), name='reports-products'),
]
