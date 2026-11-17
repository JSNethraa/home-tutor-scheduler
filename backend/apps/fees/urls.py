from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeeInvoiceViewSet, FeePaymentViewSet, DownloadReceiptPDFView

router = DefaultRouter()
router.register('invoices', FeeInvoiceViewSet, basename='invoice')
router.register('payments', FeePaymentViewSet, basename='payment')

urlpatterns = [
    path('receipts/<int:payment_id>/download/', DownloadReceiptPDFView.as_view(), name='receipt-download'),
    path('', include(router.urls)),
]
