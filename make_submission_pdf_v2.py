# Builds the code-listing + screenshots sections of the submission PDF.
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak,
                                Preformatted, Table, TableStyle)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get('OUT_PDF', '/tmp/pdfwork/code_and_screens.pdf')

PRIMARY = HexColor('#000000')
MUTED = HexColor('#595959')
CODE_BG = HexColor('#F4F4F4')

styles = getSampleStyleSheet()
h1 = ParagraphStyle('H1x', parent=styles['Heading1'], textColor=PRIMARY, fontSize=18, spaceAfter=10)
h2 = ParagraphStyle('H2x', parent=styles['Heading2'], fontSize=12, spaceBefore=14, spaceAfter=4)
normal = styles['Normal']
codestyle = ParagraphStyle('Codex', fontName='Courier', fontSize=6.4, leading=7.6,
                           backColor=CODE_BG, borderPadding=4, spaceAfter=10)
ph_style = ParagraphStyle('Ph', parent=styles['Normal'], textColor=MUTED, fontSize=11,
                          alignment=1, leading=16)

EXCLUDE_DIRS = {'node_modules', 'dist', 'uploads', '.git', '__pycache__'}
EXCLUDE_FILES = {'package-lock.json', 'make_submission_pdf.py', 'make_submission_pdf_v2.py',
                 'unifix-project.zip', 'README.md'}

def gather_files():
    ordered = []
    for base in ['', 'server', 'client']:
        top = os.path.join(ROOT, base) if base else ROOT
        for dirpath, dirnames, filenames in os.walk(top):
            dirnames[:] = [d for d in sorted(dirnames) if d not in EXCLUDE_DIRS]
            if base == '' and dirpath == ROOT:
                dirnames[:] = []  # only top-level files on the root pass
            for fn in sorted(filenames):
                rel = os.path.relpath(os.path.join(dirpath, fn), ROOT)
                if fn in EXCLUDE_FILES or (fn.startswith('.env') and fn != '.env.example'):
                    continue
                if fn.endswith(('.zip', '.pdf', '.docx', '.jpg', '.png', '.pyc')):
                    continue
                if rel not in [r for r, _ in ordered]:
                    ordered.append((rel, os.path.join(dirpath, fn)))
    return ordered

story = []

# ---- Cover ----
story.append(Spacer(1, 1.6 * inch))
story.append(Paragraph('MIVA Open University', ParagraphStyle(
    'cov0', fontSize=16, alignment=1, fontName='Helvetica-Bold')))
story.append(Spacer(1, 8))
story.append(Paragraph('MIT 8333 - Advanced Web Application Development', ParagraphStyle(
    'cov0b', fontSize=12, alignment=1)))
story.append(Spacer(1, 40))
story.append(Paragraph('UniFix - University Maintenance Service Request System', ParagraphStyle(
    'cov', fontSize=20, leading=26, alignment=1, textColor=PRIMARY, fontName='Helvetica-Bold')))
story.append(Spacer(1, 14))
story.append(Paragraph('Project Submission', ParagraphStyle('cov2', fontSize=14, alignment=1)))
story.append(Spacer(1, 50))
details = [
    ('Name', 'Paschal Odu'),
    ('Department', 'MIT'),
    ('Matric Number', '2025/A/MIT/0664'),
    ('Student ID', '301835317'),
    ('School Email', 'p.odu5317@miva.edu.ng'),
    ('Date', 'July 2026'),
]
for label, value in details:
    story.append(Paragraph(f'<b>{label}:</b> {value}', ParagraphStyle(
        f'd{label}', fontSize=12, alignment=1, spaceAfter=8)))
story.append(Spacer(1, 50))
story.append(Paragraph('Part 1 - Complete Code Base', ParagraphStyle('cov3', fontSize=12, alignment=1)))
story.append(Paragraph('Part 2 - Screenshots of the Output', ParagraphStyle('cov4', fontSize=12, alignment=1)))
story.append(Paragraph('Part 3 - Project Report', ParagraphStyle('cov5', fontSize=12, alignment=1)))
story.append(PageBreak())

# ---- Part 1: Code base ----
story.append(Paragraph('Part 1 - Complete Code Base', h1))
story.append(Paragraph(
    'Full source code of the application. The backend (server/) is a Node.js/Express REST API '
    'with MongoDB; the frontend (client/) is a React application built with Vite. '
    'Automated tests are included in server/tests and client/src/tests.', normal))
story.append(Spacer(1, 8))

files = gather_files()
story.append(Paragraph(f'Files included: {len(files)}', normal))
story.append(Spacer(1, 4))
for rel, _ in files:
    story.append(Paragraph(rel.replace(os.sep, '/'), ParagraphStyle('toc', fontName='Courier', fontSize=8, leading=10)))
story.append(PageBreak())

for rel, path in files:
    try:
        with open(path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
    except Exception:
        continue
    story.append(Paragraph(rel.replace(os.sep, '/'), h2))
    wrapped = []
    for line in content.split('\n'):
        while len(line) > 118:
            wrapped.append(line[:118])
            line = line[118:]
        wrapped.append(line)
    story.append(Preformatted('\n'.join(wrapped), codestyle))

# ---- Part 2: Screenshots ----
story.append(PageBreak())
story.append(Paragraph('Part 2 - Screenshots of the Output', h1))
story.append(Paragraph(
    'The screenshots below show the major interfaces and outputs of the running application.', normal))
story.append(Spacer(1, 10))

shots = [
    'Login page',
    'Registration page (with validation feedback)',
    'Student/Staff dashboard - My Requests with search and filters',
    'Service request submission form with photo upload',
    'Request tracking page - status badge and history timeline',
    'Maintenance officer dashboard - Requests Assigned to Me',
    'Officer updating a request to Completed',
    'Admin dashboard with statistics cards',
    'Admin assigning a request to an officer',
    'Admin user management page',
    'Admin activity log (audit trail)',
    'Backend test results - npm test (server)',
    'Frontend test results - npm test (client)',
    'Deployed site in the browser + /api/health response',
]
for i, label in enumerate(shots):
    box = Table([[Paragraph(f'[ Screenshot {i+1}: {label} ]', ph_style)]],
                colWidths=[6.5 * inch], rowHeights=[3.0 * inch])
    box.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.8, MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(Paragraph(f'2.{i+1}  {label}', h2))
    story.append(box)
    story.append(Spacer(1, 12))

def footer(canv, doc_):
    canv.saveState()
    canv.setFont('Helvetica', 8)
    canv.setFillColor(MUTED)
    canv.drawCentredString(letter[0] / 2, 0.4 * inch,
                           f'Paschal Odu - 2025/A/MIT/0664 - MIT 8333 Project Submission - page {doc_.page}')
    canv.restoreState()

doc = SimpleDocTemplate(OUT, pagesize=letter,
                        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
                        topMargin=0.7 * inch, bottomMargin=0.7 * inch)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print('written', OUT)
