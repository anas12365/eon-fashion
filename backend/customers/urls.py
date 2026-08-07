from django.urls import path

from .views import CustomerDetailView, CustomerListView

urlpatterns = [
    path('', CustomerListView.as_view(), name='customer-list'),
    # `phone` is a value, not a numeric id — frontend must
    # encodeURIComponent() it since phone numbers can contain "+".
    path('<str:phone>/', CustomerDetailView.as_view(), name='customer-detail'),
]
