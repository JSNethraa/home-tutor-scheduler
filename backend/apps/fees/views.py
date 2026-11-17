import io
from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse

from .models import FeeInvoice, FeePayment
from .serializers import (
    FeeInvoiceSerializer,
    FeePaymentSerializer,
    RecordPaymentRequestSerializer
)
from apps.accounts.permissions import IsAdminUserRole, IsAdminOrTutor

# ReportLab imports for PDF receipt generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class FeeInvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = FeeInvoiceSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'my_invoices']:
            return [IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        user = self.request.user
        qs = FeeInvoice.objects.select_related('student__user', 'batch').prefetch_related('payments').all()

        student_id = self.request.query_params.get('student_id')
        if student_id:
            qs = qs.filter(student_id=student_id)

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        # Scoping based on user role
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            return qs.filter(student=user.student_profile)
        elif user.role == 'PARENT' and hasattr(user, 'parent_profile'):
            return qs.filter(student__parent=user.parent_profile)

        return qs

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def record_payment(self, request, pk=None):
        invoice = self.get_object()
        serializer = RecordPaymentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        payment = FeePayment.objects.create(
            invoice=invoice,
            amount_paid=data['amount_paid'],
            payment_date=data['payment_date'],
            payment_method=data['payment_method'],
            transaction_reference=data.get('transaction_reference', ''),
            notes=data.get('notes', ''),
            recorded_by=request.user
        )

        return Response(FeePaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUserRole])
    def summary(self, request):
        invoices = FeeInvoice.objects.all()
        payments = FeePayment.objects.all()

        total_billed = sum(inv.amount_due for inv in invoices)
        total_collected = sum(p.amount_paid for p in payments)
        total_pending = max(0.0, float(total_billed) - float(total_collected))

        unpaid_count = invoices.filter(status=FeeInvoice.Status.UNPAID).count()
        partially_paid_count = invoices.filter(status=FeeInvoice.Status.PARTIALLY_PAID).count()
        paid_count = invoices.filter(status=FeeInvoice.Status.PAID).count()

        return Response({
            'total_billed': float(total_billed),
            'total_collected': float(total_collected),
            'total_pending': float(total_pending),
            'unpaid_invoices': unpaid_count,
            'partially_paid_invoices': partially_paid_count,
            'paid_invoices': paid_count,
        })


class FeePaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FeePaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = FeePayment.objects.select_related('invoice__student__user', 'invoice__batch').all()

        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            return qs.filter(invoice__student=user.student_profile)
        elif user.role == 'PARENT' and hasattr(user, 'parent_profile'):
            return qs.filter(invoice__student__parent=user.parent_profile)

        return qs


class DownloadReceiptPDFView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        try:
            payment = FeePayment.objects.select_related(
                'invoice__student__user',
                'invoice__batch__tutor__user',
                'recorded_by'
            ).get(id=payment_id)
        except FeePayment.DoesNotExist:
            return Response({'error': 'Payment record not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Access check
        user = request.user
        if user.role == 'STUDENT' and payment.invoice.student.user != user:
            return Response({'error': 'Unauthorized access.'}, status=status.HTTP_403_FORBIDDEN)
        if user.role == 'PARENT' and payment.invoice.student.parent and payment.invoice.student.parent.user != user:
            return Response({'error': 'Unauthorized access.'}, status=status.HTTP_403_FORBIDDEN)

        # Build PDF using ReportLab
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=20, textColor=colors.HexColor('#1E3A8A'), alignment=1)
        sub_style = ParagraphStyle('SubStyle', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#6B7280'), alignment=1)
        header_style = ParagraphStyle('HeaderStyle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#374151'))
        cell_style = ParagraphStyle('CellStyle', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#1F2937'))

        story = []
        story.append(Paragraph("HOME TUTOR & COACHING ACADEMY", title_style))
        story.append(Paragraph("Official Tuition Fee Payment Receipt", sub_style))
        story.append(Spacer(1, 15))

        # Receipt metadata table
        student = payment.invoice.student
        student_name = student.user.get_full_name() or student.user.username
        batch_name = payment.invoice.batch.name

        info_data = [
            [Paragraph("Receipt Number:", header_style), Paragraph(payment.receipt_number, cell_style),
             Paragraph("Date:", header_style), Paragraph(str(payment.payment_date), cell_style)],
            [Paragraph("Invoice Number:", header_style), Paragraph(payment.invoice.invoice_number, cell_style),
             Paragraph("Payment Mode:", header_style), Paragraph(payment.get_payment_method_display(), cell_style)],
            [Paragraph("Student Name:", header_style), Paragraph(student_name, cell_style),
             Paragraph("Grade / Class:", header_style), Paragraph(student.grade_level, cell_style)],
            [Paragraph("Batch / Course:", header_style), Paragraph(batch_name, cell_style),
             Paragraph("Billing Period:", header_style), Paragraph(payment.invoice.billing_month, cell_style)],
            [Paragraph("Transaction Ref:", header_style), Paragraph(payment.transaction_reference or "N/A", cell_style),
             Paragraph("Recorded By:", header_style), Paragraph(payment.recorded_by.get_full_name() if payment.recorded_by else "Admin", cell_style)],
        ]

        t_info = Table(info_data, colWidths=[110, 160, 110, 160])
        t_info.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F9FAFB')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t_info)
        story.append(Spacer(1, 20))

        # Financial breakdown table
        financial_data = [
            [Paragraph("Description", header_style), Paragraph("Total Fee", header_style), Paragraph("Amount Paid", header_style), Paragraph("Balance Remaining", header_style)],
            [
                Paragraph(f"Tuition Fee ({payment.invoice.billing_month}) - {batch_name}", cell_style),
                Paragraph(f"Rs. {payment.invoice.amount_due:.2f}", cell_style),
                Paragraph(f"Rs. {payment.amount_paid:.2f}", cell_style),
                Paragraph(f"Rs. {payment.invoice.balance_remaining:.2f}", cell_style),
            ]
        ]
        t_fin = Table(financial_data, colWidths=[240, 100, 100, 100])
        t_fin.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D1D5DB')),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(t_fin)
        story.append(Spacer(1, 30))

        # Footer notes
        footer_note = Paragraph("<i>Thank you for your payment! This is a system-generated electronic receipt and does not require a physical signature.</i>", sub_style)
        story.append(footer_note)

        doc.build(story)
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Receipt_{payment.receipt_number}.pdf"'
        return response
