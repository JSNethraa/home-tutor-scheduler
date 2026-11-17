from rest_framework import serializers
from .models import FeeInvoice, FeePayment
from apps.accounts.serializers import StudentProfileSerializer
from apps.batches.serializers import BatchSerializer
from apps.accounts.models import StudentProfile
from apps.batches.models import Batch

class FeePaymentSerializer(serializers.ModelSerializer):
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)

    class Meta:
        model = FeePayment
        fields = [
            'id', 'invoice', 'amount_paid', 'payment_date',
            'payment_method', 'payment_method_display',
            'transaction_reference', 'receipt_number', 'notes',
            'recorded_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'receipt_number', 'created_at']


class FeeInvoiceSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.objects.all(),
        source='student',
        write_only=True
    )
    batch = BatchSerializer(read_only=True)
    batch_id = serializers.PrimaryKeyRelatedField(
        queryset=Batch.objects.all(),
        source='batch',
        write_only=True
    )
    total_paid = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    balance_remaining = serializers.FloatField(read_only=True)
    payments = FeePaymentSerializer(many=True, read_only=True)

    class Meta:
        model = FeeInvoice
        fields = [
            'id', 'student', 'student_id', 'batch', 'batch_id',
            'invoice_number', 'billing_month', 'amount_due', 'total_paid',
            'balance_remaining', 'due_date', 'status', 'payments', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'total_paid', 'balance_remaining']


class RecordPaymentRequestSerializer(serializers.Serializer):
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=1)
    payment_date = serializers.DateField(required=True)
    payment_method = serializers.ChoiceField(choices=FeePayment.PaymentMethod.choices, default='UPI')
    transaction_reference = serializers.CharField(required=False, allow_blank=True, default='')
    notes = serializers.CharField(required=False, allow_blank=True, default='')
