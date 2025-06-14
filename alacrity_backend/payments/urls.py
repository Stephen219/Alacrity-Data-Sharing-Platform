from django.urls import path
from .views import PurchaseHistoryView, create_paypal_payment, paypal_success, paypal_cancel

urlpatterns = [
    path('paypal/payment/<str:dataset_id>/', create_paypal_payment, name='paypal-payment'),
    path('paypal/success/', paypal_success, name='paypal-success'),
    path('paypal/cancel/', paypal_cancel, name='paypal-cancel'),
    path("purchase-history/", PurchaseHistoryView.as_view(), name="purchase-history"),
]
