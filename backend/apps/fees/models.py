import uuid
from django.db import models
from django.conf import settings
from apps.accounts.models import StudentProfile
from apps.batches.models import Batch

class FeeInvoice(models.Model):
    class Status(models.TextChoices):
        UNPAID = 'UNPAID', 'Unpaid'
        PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
        PAID = 'PAID', 'Paid'
        OVERDUE = 'OVERDUE', 'Overdue'

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='invoices')
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=60, unique=True)
    billing_month = models.CharField(max_length=30, help_text="e.g. November 2026")
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNPAID)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.student} ({self.status})"

    @property
    def total_paid(self):
        return sum(p.amount_paid for p in self.payments.all())

    @property
    def balance_remaining(self):
        return max(0.0, float(self.amount_due) - float(self.total_paid))

    def update_status(self):
        paid = float(self.total_paid)
        due = float(self.amount_due)
        if paid >= due:
            self.status = self.Status.PAID
        elif paid > 0:
            self.status = self.Status.PARTIALLY_PAID
        else:
            self.status = self.Status.UNPAID
        self.save()


class FeePayment(models.Model):
    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Cash'
        UPI = 'UPI', 'UPI / QR Code'
        BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer / NEFT'
        CARD = 'CARD', 'Debit / Credit Card'
        OTHER = 'OTHER', 'Other'

    invoice = models.ForeignKey(FeeInvoice, on_delete=models.CASCADE, related_name='payments')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.UPI)
    transaction_reference = models.CharField(max_length=100, blank=True, null=True, help_text="UTR / UPI Ref / Cheque No.")
    receipt_number = models.CharField(max_length=60, unique=True)
    notes = models.TextField(blank=True, null=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f"Payment {self.receipt_number} ({self.amount_paid}) for {self.invoice.invoice_number}"

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            self.receipt_number = f"REC-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
        self.invoice.update_status()
