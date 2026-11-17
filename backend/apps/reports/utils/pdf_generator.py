import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_progress_report_pdf(report):
    """
    Generates a professionally styled PDF progress report card for a student.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    primary_color = colors.HexColor('#1E3A8A')    # Deep Indigo
    secondary_color = colors.HexColor('#2563EB')  # Blue
    dark_text = colors.HexColor('#1F2937')
    gray_text = colors.HexColor('#4B5563')

    header_style = ParagraphStyle(
        'MainHeader',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=primary_color,
        alignment=1
    )
    subhead_style = ParagraphStyle(
        'SubHeader',
        parent=styles['Normal'],
        fontSize=11,
        textColor=gray_text,
        alignment=1
    )
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=6
    )
    label_style = ParagraphStyle(
        'LabelStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor('#374151')
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=dark_text
    )

    story = []

    # Title & Banner
    story.append(Paragraph("HOME TUTOR & COACHING ACADEMY", header_style))
    story.append(Paragraph("STUDENT ACADEMIC & PROGRESS PERFORMANCE REPORT", subhead_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=4, spaceAfter=15))

    # Student & Batch Info
    student = report.student
    student_name = student.user.get_full_name() or student.user.username
    parent_name = student.parent.user.get_full_name() if (student.parent and student.parent.user) else "N/A"
    tutor_name = report.batch.tutor.user.get_full_name() or report.batch.tutor.user.username

    info_data = [
        [Paragraph("Student Name:", label_style), Paragraph(student_name, body_style),
         Paragraph("Grade / Level:", label_style), Paragraph(student.grade_level, body_style)],
        [Paragraph("Parent / Guardian:", label_style), Paragraph(parent_name, body_style),
         Paragraph("Batch / Course:", label_style), Paragraph(report.batch.name, body_style)],
        [Paragraph("Lead Tutor:", label_style), Paragraph(tutor_name, body_style),
         Paragraph("Evaluation Period:", label_style), Paragraph(f"{report.period_start} to {report.period_end}", body_style)],
    ]

    t_info = Table(info_data, colWidths=[110, 160, 110, 160])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 15))

    # Academic Performance Summary Gauges
    story.append(Paragraph("Performance Metrics", section_style))
    metrics_data = [
        [
            Paragraph("Class Attendance Rate", label_style),
            Paragraph("Average Assessment Score", label_style),
            Paragraph("Course Completion Status", label_style)
        ],
        [
            Paragraph(f"<font size='14' color='#16A34A'><b>{report.attendance_percentage}%</b></font>", body_style),
            Paragraph(f"<font size='14' color='#2563EB'><b>{report.average_test_score}%</b></font>", body_style),
            Paragraph(f"<font size='12' color='#4B5563'><b>{report.batch.status}</b></font>", body_style)
        ]
    ]
    t_metrics = Table(metrics_data, colWidths=[180, 180, 180])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#EFF6FF')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#BFDBFE')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_metrics)
    story.append(Spacer(1, 15))

    # Strengths and Areas of Improvement
    story.append(Paragraph("Tutor Observations & Qualitative Assessment", section_style))
    feedback_data = [
        [Paragraph("Key Strengths & Achievements:", label_style)],
        [Paragraph(report.strengths or "Consistent effort and active class participation.", body_style)],
        [Paragraph("Areas for Improvement & Practice:", label_style)],
        [Paragraph(report.areas_for_improvement or "Review homework problem sets regularly.", body_style)],
        [Paragraph("Overall Tutor Remarks:", label_style)],
        [Paragraph(report.tutor_remarks, body_style)],
    ]
    t_feedback = Table(feedback_data, colWidths=[540])
    t_feedback.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (0,2), (0,2), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (0,4), (0,4), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94A3B8')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_feedback)
    story.append(Spacer(1, 25))

    # Signature Block
    sig_data = [
        [
            Paragraph("____________________________<br/><b>Lead Tutor Signature</b>", body_style),
            Paragraph("____________________________<br/><b>Institute Coordinator / Seal</b>", body_style),
            Paragraph("____________________________<br/><b>Parent Signature</b>", body_style),
        ]
    ]
    t_sig = Table(sig_data, colWidths=[180, 180, 180])
    t_sig.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_sig)

    doc.build(story)
    buffer.seek(0)
    return buffer
