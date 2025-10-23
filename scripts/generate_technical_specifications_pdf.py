# Usage: python scripts/generate_technical_specifications_pdf.py
"""Generate a professional PDF consolidating markdown files from a folder.

By default, the script reads all ``.md`` files (excluding ``readme.md``) from an
input directory (default: ``docs/01-about``), and writes the PDF to the project
``pdf`` directory. The document title is derived from the folder name with
leading numbers removed (e.g., ``01-about`` → "About"), while the output
filename retains the original folder name including numbers (e.g.,
``docs/01-about`` → ``pdf/01-about.pdf``).
"""
from __future__ import annotations

import argparse
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
import re
from xml.sax.saxutils import escape
from pathlib import Path
from typing import Iterable, List, Match

try:
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
    from reportlab.lib.pagesizes import LETTER
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        BaseDocTemplate,
        Frame,
        HRFlowable,
        ListFlowable,
        ListItem,
        PageBreak,
        PageTemplate,
        Paragraph,
        Preformatted,
        Spacer,
        Table,
        TableStyle,
    )
    from reportlab.platypus.tableofcontents import TableOfContents
    from reportlab.lib import colors
    from reportlab.lib import fonts as rl_fonts
except ImportError as exc:  # pragma: no cover - guard for runtime execution
    raise SystemExit(
        "The 'reportlab' package is required to run this script. Install it with 'pip install reportlab'."
    ) from exc


BOLD_RE = re.compile(r"\*\*(.+?)\*\*")
ITALIC_RE = re.compile(r"_(.+?)_")
CODE_RE = re.compile(r"`([^`]+)`")
LINK_RE = re.compile(r"\[(.+?)\]\((.+?)\)")
EXTERNAL_LINK_SCHEME_RE = re.compile(r"^[a-z][a-z0-9+.-]*:", re.IGNORECASE)
FONT_FACE_RE = re.compile(r"(face=)([\"'])([^\"']+)(\2)", re.IGNORECASE)


FONT_FACE_ALIASES = {
    "courier": "Courier",
    "courier new": "Courier",
    "courier-new": "Courier",
    "couriernew": "Courier",
    "monospace": "Courier",
}


_HEADING_SLUG_COUNTS: Counter[str] = Counter()
_FALLBACK_HEADING_INDEX = 0


def reset_heading_slug_tracking() -> None:
    """Reset global heading slug state prior to building a document."""

    _HEADING_SLUG_COUNTS.clear()
    global _FALLBACK_HEADING_INDEX
    _FALLBACK_HEADING_INDEX = 0


def slugify_anchor(text: str) -> str:
    """Create a URL-friendly anchor name similar to GitHub heading slugs."""

    normalized = text.strip().lower()
    normalized = re.sub(r"[^\w\s-]", "", normalized)
    normalized = re.sub(r"\s+", "-", normalized)
    normalized = re.sub(r"-+", "-", normalized)
    return normalized.strip("-")


def register_heading_anchor(text: str) -> str:
    """Return a unique anchor name for a heading and track it globally."""

    global _FALLBACK_HEADING_INDEX
    base = slugify_anchor(text)
    if not base:
        _FALLBACK_HEADING_INDEX += 1
        base = f"section-{_FALLBACK_HEADING_INDEX}"

    count = _HEADING_SLUG_COUNTS[base]
    _HEADING_SLUG_COUNTS[base] += 1
    if count:
        return f"{base}-{count}"
    return base


def normalize_internal_target(target: str) -> str:
    """Normalize a markdown fragment identifier to match generated anchors."""

    return slugify_anchor(target.lstrip("#"))


NAVIGATION_MARKERS = ("← Previous", "Next →")
TOC_HEADING_TITLES = {"table of contents", "contents"}
TOC_DIRECTIVES = {"[toc]", "[[toc]]", "{{toc}}", "<!-- toc -->", "<!--toc-->"}


DEFAULT_INPUT_DIR = Path("docs/02-technical-specifications")
DEFAULT_OUTPUT = DEFAULT_INPUT_DIR / "technical-specifications.pdf"  # legacy default; not used when deriving from folder


def _derive_title_from_folder_name(folder_name: str) -> str:
    """Convert a folder name into a human-friendly document title.

    Rules:
    - Strip any leading digits and separators like '-', '_', or '.' (e.g., '01-about' -> 'about').
    - Replace '-', '_' and multiple spaces with a single space.
    - Title-case the result.
    - Fallback to the raw folder name if normalization empties the string.
    """
    base = re.sub(r"^\d+[\-_.\s]*", "", folder_name or "").strip()
    base = re.sub(r"[\-_.]+", " ", base)
    base = re.sub(r"\s+", " ", base).strip()
    if not base:
        base = (folder_name or "Document").strip()
    return base.title()


def _derive_filename_from_folder_name(folder_name: str) -> str:
    """Create a clean PDF filename from a folder name, keeping numbers.

    Examples:
    - '01-about' -> '01-about.pdf'
    - '02-technical-specifications' -> '02-technical-specifications.pdf'
    - 'docs_v2' -> 'docs-v2.pdf'
    """
    base = (folder_name or "").strip()
    base = re.sub(r"[\s_]+", "-", base)
    base = re.sub(r"[^A-Za-z0-9\-]+", "", base)
    base = base.strip("-").lower() or "document"
    return f"{base}.pdf"


@dataclass(frozen=True)
class DocumentBranding:
    """Configuration options for document branding and metadata."""

    project_name: str = "Project-X"
    cover_subtitle: str = "Corporate Strategy & Intelligence Dossier"
    prepared_for: str = "Project-X Executive Leadership Team"
    prepared_by: str = "Strategy & Compliance Office"
    classification: str = "Strictly Confidential – Do Not Distribute"
    header_title: str = "Project X — Strategic Overview"
    header_date_format: str = "%B %d, %Y"
    confidentiality_notice: str = "Confidential – Attorney-Client Privileged & Proprietary"
    rights_notice_template: str = "© {year} {project} - Innovista. All rights reserved."

# Edit the values in ``DEFAULT_BRANDING`` to customize the header, footer, and
# cover page without touching the rendering logic.
DEFAULT_BRANDING = DocumentBranding()


class AboutDocTemplate(BaseDocTemplate):
    """Document template adding a uniform header, footer, and page numbers."""

    def __init__(self, filename: Path, branding: DocumentBranding):
        super().__init__(str(filename), pagesize=LETTER)
        self.branding = branding
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )
        template = PageTemplate(id="normal", frames=[frame], onPage=self._header_footer)
        self.addPageTemplates([template])
        self._last_heading_level = 0

    def _header_footer(self, canvas, doc) -> None:  # pragma: no cover - layout code
        canvas.saveState()
        page_width, page_height = LETTER
        canvas.saveState()
        canvas.setFillColorRGB(0.9, 0.9, 0.9)
        canvas.setFont("Helvetica-Bold", 60)
        canvas.translate(page_width / 2, page_height / 2)
        canvas.rotate(45)
        canvas.drawCentredString(0, 0, "CONFIDENTIAL")
        canvas.restoreState()
        # Set PDF metadata title based on branding
        try:
            canvas.setTitle(self.branding.project_name)
        except Exception:
            pass
        header_title = self.branding.header_title
        header_date = datetime.now().strftime(self.branding.header_date_format)
        canvas.setFont("Helvetica-Bold", 11)
        canvas.drawString(doc.leftMargin, page_height - 0.65 * inch, header_title)
        canvas.setFont("Helvetica", 9)
        canvas.drawRightString(page_width - doc.rightMargin, page_height - 0.65 * inch, header_date)

        footer_confidentiality = self.branding.confidentiality_notice
        footer_rights = self.branding.rights_notice_template.format(
            year=datetime.now().year, project=self.branding.project_name
        )
        page_label = f"Page {canvas.getPageNumber()}"
        canvas.setFont("Helvetica", 8)
        canvas.drawString(doc.leftMargin, 0.65 * inch, footer_confidentiality)
        canvas.drawString(doc.leftMargin, 0.5 * inch, footer_rights)
        canvas.drawRightString(page_width - doc.rightMargin, 0.5 * inch, page_label)
        canvas.restoreState()


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="CoverTitle",
            parent=styles["Title"],
            alignment=TA_CENTER,
            fontSize=32,
            leading=36,
            spaceAfter=24,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverSubtitle",
            parent=styles["Title"],
            alignment=TA_CENTER,
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#2F5597"),
            spaceAfter=48,
        )
    )
    styles.add(
        ParagraphStyle(
            name="LegalBlock",
            parent=styles["Normal"],
            alignment=TA_JUSTIFY,
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#555555"),
            spaceBefore=24,
        )
    )

    styles.add(
        ParagraphStyle(
            name="TableHeader",
            parent=styles["Heading4"],
            alignment=TA_CENTER,
            fontSize=10,
            leading=12,
            textColor=colors.white,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TableCell",
            parent=styles["BodyText"],
            fontSize=10,
            leading=12,
            spaceAfter=4,
        )
    )

    heading1 = ParagraphStyle(
        name="AboutHeading1",
        parent=styles["Heading1"],
        spaceBefore=18,
        spaceAfter=10,
        leading=20,
    )
    heading1.outline_level = 0
    styles.add(heading1)

    heading2 = ParagraphStyle(
        name="AboutHeading2",
        parent=styles["Heading2"],
        spaceBefore=14,
        spaceAfter=8,
        leading=18,
    )
    heading2.outline_level = 1
    styles.add(heading2)

    heading3 = ParagraphStyle(
        name="AboutHeading3",
        parent=styles["Heading3"],
        spaceBefore=12,
        spaceAfter=6,
        leading=16,
    )
    heading3.outline_level = None
    styles.add(heading3)

    styles.add(
        ParagraphStyle(
            name="AboutBody",
            parent=styles["BodyText"],
            leading=14,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="AboutBullet",
            parent=styles["BodyText"],
            leftIndent=18,
            bulletIndent=9,
            spaceBefore=0,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="AboutQuote",
            parent=styles["Italic"],
            leftIndent=18,
            rightIndent=18,
            textColor=colors.HexColor("#1F4E79"),
            spaceBefore=6,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TldrHeading",
            parent=styles["Heading3"],
            textColor=colors.HexColor("#1F4E79"),
            spaceBefore=0,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TldrBody",
            parent=styles["BodyText"],
            leading=14,
            spaceBefore=0,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TOCTitle",
            parent=styles["Heading1"],
            alignment=TA_CENTER,
            spaceAfter=18,
        )
    )
    return styles


def _replace_markdown_link(match: Match[str]) -> str:
    text, href = match.groups()
    if href.startswith("#") or not EXTERNAL_LINK_SCHEME_RE.match(href):
        return ""
    return f'<link href="{href}">{text}</link>'


def _sanitize_font_name(font: str) -> str:
    """Return a ReportLab-safe font name, defaulting to Courier when unknown."""

    # Strip any accidental surrounding quotes and normalize spaces
    font = font.strip().strip("'\"")
    normalized = FONT_FACE_ALIASES.get(font.lower(), font)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    if not normalized:
        return "Courier"
    try:
        rl_fonts.ps2tt(normalized)
    except ValueError:
        return "Courier"
    return normalized


def _normalize_font_face(match: Match[str]) -> str:
    attr, quote, value, closing = match.groups()
    fonts = [alias.strip() for alias in value.split(",") if alias.strip()]
    normalized_fonts = []
    for font in fonts:
        normalized_fonts.append(_sanitize_font_name(font))
    if not normalized_fonts:
        normalized_fonts.append("Courier")
    normalized = ", ".join(dict.fromkeys(normalized_fonts))
    return f"{attr}{quote}{normalized}{closing}"


def format_inline(text: str) -> str:
    cleaned = (
        text.replace("<br />", "\n")
        .replace("<br/>", "\n")
        .replace("<br>", "\n")
        .replace("<ul>", "")
        .replace("</ul>", "")
        .replace("</li>", "\n")
        # Avoid U+2022 (•) which built-in Helvetica can't render; use ASCII dash
        .replace("<li>", "- ")
    )

    # 1) Extract inline code spans first and replace with placeholders
    code_chunks: List[str] = []

    def _code_placeholder(m: Match[str]) -> str:
        idx = len(code_chunks)
        code_chunks.append(m.group(1))
        return f"\x00CODE{idx}\x00"

    with_placeholders = CODE_RE.sub(_code_placeholder, cleaned)

    # 2) Escape and apply other inline formatting (bold/italic/links)
    escaped = escape(with_placeholders, {"'": "&apos;"})
    escaped = re.sub(r"__(.+?)__", r"<b>\1</b>", escaped)
    escaped = BOLD_RE.sub(r"<b>\1</b>", escaped)
    escaped = ITALIC_RE.sub(r"<i>\1</i>", escaped)
    escaped = LINK_RE.sub(_replace_markdown_link, escaped)
    escaped = FONT_FACE_RE.sub(_normalize_font_face, escaped)

    # 3) Restore code spans with safe markup (avoid <font face=...>)
    for idx, raw in enumerate(code_chunks):
        safe = escape(raw, {"'": "&apos;"})
        code_html = f'<span backcolor="#F5F5F5"><u>{safe}</u></span>'
        escaped = escaped.replace(f"\x00CODE{idx}\x00", code_html)

    return escaped.replace("\n", "<br/>")


def is_navigation_line(line: str) -> bool:
    """Return ``True`` when the markdown line is a navigation breadcrumb."""

    if not isinstance(line, str):  # defensive guard for unexpected input
        return False
    stripped = line.strip()
    if not stripped:
        return False
    return any(marker in stripped for marker in NAVIGATION_MARKERS)


def is_table_divider(cells: List[str]) -> bool:
    for cell in cells:
        stripped = cell.strip().replace(":", "").replace("-", "")
        if stripped:
            return False
    return True


def parse_table(lines: List[str], start_index: int) -> tuple[List[List[str]], int] | tuple[None, int]:
    table_lines: List[str] = []
    index = start_index
    while index < len(lines):
        candidate = lines[index].strip()
        if not candidate or not candidate.startswith("|"):
            break
        table_lines.append(candidate)
        index += 1

    if len(table_lines) < 2:
        return None, start_index

    rows: List[List[str]] = []
    for entry in table_lines:
        cells = [cell.strip() for cell in entry.strip("|").split("|")]
        rows.append(cells)

    parsed_rows: List[List[str]] = []
    for idx, row in enumerate(rows):
        if idx == 1 and is_table_divider(row):
            continue
        parsed_rows.append([format_inline(cell) for cell in row])

    return parsed_rows, index


def build_table_flowable(rows: List[List[str]], styles) -> Table:
    header = [Paragraph(cell, styles["TableHeader"]) for cell in rows[0]]
    data = [header]
    for row in rows[1:]:
        data.append([Paragraph(cell, styles["TableCell"]) for cell in row])

    table = Table(data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F4E79")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("LINEBELOW", (0, 0), (-1, 0), 1, colors.HexColor("#16365D")),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#BFBFBF")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#BFBFBF")),
            ]
        )
    )
    return table


def build_horizontal_rule() -> HRFlowable:
    return HRFlowable(width="100%", thickness=1, color=colors.HexColor("#DDDDDD"), spaceBefore=8, spaceAfter=8)


def flush_bullets(bullets: List[str], styles) -> ListFlowable | None:
    if not bullets:
        return None
    list_items: List[ListItem] = []
    for item in bullets:
        formatted = format_inline(item)
        if not formatted.strip():
            continue
        list_items.append(ListItem(Paragraph(formatted, styles["AboutBody"])))
    if not list_items:
        return None
    # Avoid U+2022 (•) to prevent missing-glyph squares; use ASCII dash
    return ListFlowable(list_items, bulletType="bullet", start="-", leftIndent=24)


def build_tldr_list_flowable(items: List[str], styles) -> ListFlowable | None:
    list_items: List[ListItem] = []
    for item in items:
        formatted = format_inline(item)
        if not formatted.strip():
            continue
        list_items.append(ListItem(Paragraph(formatted, styles["TldrBody"])))
    if not list_items:
        return None
    # Avoid U+2022 (•) to prevent missing-glyph squares; use ASCII dash
    return ListFlowable(
        list_items,
        bulletType="bullet",
        start="-",
        leftIndent=16,
    )


def build_code_block(lines: List[str], styles) -> Table:
    """Render a fenced code block using a monospace font with background.

    We wrap a Preformatted flowable in a one-cell Table to get padding,
    background, and border similar to TL;DR blocks. We also constrain the
    font to the built-in Courier to ensure glyph availability.
    """
    code_text = "\n".join(lines)
    pre = Preformatted(code_text, style=ParagraphStyle(
        name="CodeBlock",
        parent=styles["BodyText"],
        fontName="Courier",
        fontSize=8.5,
        leading=11,
    ))
    table = Table([[pre]])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F5F5F5")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return table


def build_tldr_block(lines: List[str], start_index: int, styles) -> tuple[Table | None, int]:
    index = start_index + 1  # skip the TL;DR heading line
    content_lines: List[str] = []
    while index < len(lines):
        candidate = lines[index]
        if candidate.startswith(">"):
            content_lines.append(candidate.lstrip("> "))
            index += 1
            continue
        if not candidate.strip():
            # Consume the blank line following the TL;DR block, if present.
            index += 1
        break

    if not content_lines:
        return None, index

    inner_flowables: List = [Paragraph("TL;DR", styles["TldrHeading"])]
    bullet_items: List[str] = []

    for raw in content_lines:
        text = raw.strip()
        if not text:
            if bullet_items:
                tldr_list = build_tldr_list_flowable(bullet_items, styles)
                if tldr_list:
                    inner_flowables.append(tldr_list)
                bullet_items = []
            inner_flowables.append(Spacer(1, 4))
            continue
        if text.startswith(("- ", "* ")):
            bullet_items.append(text[2:].strip())
            continue
        if bullet_items:
            tldr_list = build_tldr_list_flowable(bullet_items, styles)
            if tldr_list:
                inner_flowables.append(tldr_list)
            bullet_items = []
        formatted = format_inline(text)
        if formatted.strip():
            inner_flowables.append(Paragraph(formatted, styles["TldrBody"]))

    if bullet_items:
        tldr_list = build_tldr_list_flowable(bullet_items, styles)
        if tldr_list:
            inner_flowables.append(tldr_list)

    table_data = [[flowable] for flowable in inner_flowables]
    tldr_table = Table(table_data)
    tldr_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F5F5F5")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return tldr_table, index


def parse_markdown(markdown_path: Path, styles) -> Iterable:
    flowables = []
    bullets: List[str] = []
    lines = markdown_path.read_text(encoding="utf-8").splitlines()
    index = 0
    skip_section_level: int | None = None
    while index < len(lines):
        raw_line = lines[index]
        line = raw_line.rstrip()
        stripped_line = line.strip()

        if is_navigation_line(line):
            bullet_flowable = flush_bullets(bullets, styles)
            bullets.clear()
            if bullet_flowable:
                flowables.append(bullet_flowable)
            index += 1
            continue

        if stripped_line == "---":
            bullet_flowable = flush_bullets(bullets, styles)
            bullets.clear()
            if bullet_flowable:
                flowables.append(bullet_flowable)
            flowables.append(build_horizontal_rule())
            index += 1
            continue

        if stripped_line.lower() in TOC_DIRECTIVES:
            index += 1
            continue

        if skip_section_level is not None and not line.startswith("#"):
            index += 1
            continue

        if not stripped_line:
            bullet_flowable = flush_bullets(bullets, styles)
            bullets.clear()
            if bullet_flowable:
                flowables.append(bullet_flowable)
            flowables.append(Spacer(1, 6))
            index += 1
            continue

        # Fenced code block (```lang ... ```)
        if stripped_line.startswith("```"):
            bullet_flowable = flush_bullets(bullets, styles)
            bullets.clear()
            if bullet_flowable:
                flowables.append(bullet_flowable)
            index += 1
            code_lines: List[str] = []
            while index < len(lines):
                fence_candidate = lines[index].rstrip("\n")
                if fence_candidate.strip().startswith("```"):
                    index += 1
                    break
                code_lines.append(fence_candidate)
                index += 1
            if code_lines:
                flowables.append(build_code_block(code_lines, styles))
                flowables.append(Spacer(1, 12))
            continue

        if stripped_line.startswith("|"):
            bullet_flowable = flush_bullets(bullets, styles)
            bullets.clear()
            if bullet_flowable:
                flowables.append(bullet_flowable)
            table_rows, next_index = parse_table(lines, index)
            if table_rows:
                flowables.append(build_table_flowable(table_rows, styles))
                flowables.append(Spacer(1, 12))
                index = next_index
                continue

        if line.startswith("#"):
            bullet_flowable = flush_bullets(bullets, styles)
            bullets.clear()
            if bullet_flowable:
                flowables.append(bullet_flowable)
            level = len(line) - len(line.lstrip("#"))
            text = line[level:].strip()
            text = text.replace("<!-- omit in toc -->", "").strip()
            if not text:
                index += 1
                continue
            if skip_section_level is not None:
                if level > skip_section_level:
                    index += 1
                    continue
                skip_section_level = None
            normalized_heading = text.lower().rstrip(":")
            if normalized_heading in TOC_HEADING_TITLES:
                skip_section_level = level
                index += 1
                continue
            heading_style_name = {1: "AboutHeading1", 2: "AboutHeading2", 3: "AboutHeading3"}.get(level, "AboutHeading3")
            bookmark_name = register_heading_anchor(text)
            paragraph = Paragraph(format_inline(text), styles[heading_style_name])
            outline_level = getattr(styles[heading_style_name], "outline_level", None)
            if outline_level is not None:
                paragraph.outline_level = outline_level
            paragraph._bookmarkName = bookmark_name
            flowables.append(paragraph)
            index += 1
            continue

        normalized = line.lstrip("> ")
        if normalized.startswith(("- ", "* ")):
            bullet_text = normalized[2:].strip()
            if bullet_text:
                bullets.append(bullet_text)
            index += 1
            continue

        if raw_line.startswith(">"):
            normalized_heading = normalized.lower()
            if normalized_heading.startswith("### tl;dr"):
                bullet_flowable = flush_bullets(bullets, styles)
                bullets.clear()
                if bullet_flowable:
                    flowables.append(bullet_flowable)
                tldr_block, next_index = build_tldr_block(lines, index, styles)
                if tldr_block:
                    flowables.append(tldr_block)
                    flowables.append(Spacer(1, 12))
                index = next_index
                continue
            formatted_quote = format_inline(normalized)
            if formatted_quote.strip():
                flowables.append(Paragraph(formatted_quote, styles["AboutQuote"]))
            index += 1
            continue

        bullet_flowable = flush_bullets(bullets, styles)
        bullets.clear()
        if bullet_flowable:
            flowables.append(bullet_flowable)
        formatted_paragraph = format_inline(normalized)
        if formatted_paragraph.strip():
            flowables.append(Paragraph(formatted_paragraph, styles["AboutBody"]))
        index += 1

    bullet_flowable = flush_bullets(bullets, styles)
    if bullet_flowable:
        flowables.append(bullet_flowable)
    return flowables


def add_cover_page(story: List, styles, branding: DocumentBranding) -> None:
    today = datetime.now().strftime("%B %d, %Y")
    story.append(Spacer(1, 1.5 * inch))
    story.append(Paragraph(branding.project_name, styles["CoverTitle"]))
    story.append(Paragraph(branding.cover_subtitle, styles["CoverSubtitle"]))
    metadata_table = Table(
        [
            ["Prepared for", branding.prepared_for],
            ["Prepared by", branding.prepared_by],
            ["Document date", today],
            ["Classification", branding.classification],
        ],
        colWidths=[2.0 * inch, 4.0 * inch],
    )
    metadata_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F2F2F2")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1F4E79")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CCCCCC")),
            ]
        )
    )
    story.append(metadata_table)
    story.append(Spacer(1, 0.75 * inch))
    legal_text = (
        "This document contains proprietary, privileged, and confidential information belonging to Project X Holdings. "
        "It is provided solely for the designated recipients and must not be copied, distributed, or disclosed to any "
        "third party without prior written consent. By accepting this document you agree to maintain its confidentiality "
        "and to use the information only for the purpose for which it was provided."
    )
    story.append(Paragraph(legal_text, styles["LegalBlock"]))
    story.append(PageBreak())


def add_table_of_contents(story: List, styles, toc: TableOfContents) -> None:
    story.append(Paragraph("Table of Contents", styles["TOCTitle"]))
    toc.levelStyles = [
        ParagraphStyle(name="TOCHeading1", parent=styles["Normal"], fontSize=11, leftIndent=0, firstLineIndent=-18, spaceBefore=4, leading=14),
        ParagraphStyle(name="TOCHeading2", parent=styles["Normal"], fontSize=10, leftIndent=12, firstLineIndent=-12, spaceBefore=2, leading=12),
    ]
    story.append(toc)
    story.append(PageBreak())


def collect_markdown_files(input_dir: Path) -> List[Path]:
    if not input_dir.exists():
        raise FileNotFoundError(f"Input directory '{input_dir}' does not exist")
    files = sorted(
        (path for path in input_dir.iterdir() if path.suffix.lower() == ".md" and path.name.lower() != "readme.md"),
        key=lambda p: p.name,
    )
    if not files:
        raise FileNotFoundError(f"No markdown files found in '{input_dir}'.")
    return files


def build_story(markdown_files: Iterable[Path], styles) -> List:
    story: List = []
    for md_file in markdown_files:
        story.extend(parse_markdown(md_file, styles))
        story.append(PageBreak())
    if story:
        story.pop()  # remove trailing page break
    return story


def configure_toc_tracking(doc: AboutDocTemplate, styles):
    def after_flowable(flowable):  # pragma: no cover - layout callback
        if isinstance(flowable, Paragraph) and hasattr(flowable, "outline_level"):
            level = getattr(flowable, "outline_level", None)
            if level is None:
                return
            text = flowable.getPlainText()
            bookmark_name = getattr(flowable, "_bookmarkName", None)
            if bookmark_name:
                doc.canv.bookmarkPage(bookmark_name)
            entry = (level, text, doc.canv.getPageNumber())
            if bookmark_name:
                entry += (bookmark_name,)
            doc.notify("TOCEntry", entry)

    doc.afterFlowable = after_flowable


def generate_pdf(
    input_dir: Path = DEFAULT_INPUT_DIR,
    output_path: Path = DEFAULT_OUTPUT,
    branding: DocumentBranding = DEFAULT_BRANDING,
) -> Path:
    styles = build_styles()
    reset_heading_slug_tracking()
    markdown_files = collect_markdown_files(input_dir)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.exists():
        if output_path.is_dir():
            raise IsADirectoryError(f"Output path '{output_path}' is a directory, expected a file path.")
        output_path.unlink()

    doc = AboutDocTemplate(output_path, branding)
    toc = TableOfContents()
    configure_toc_tracking(doc, styles)

    story: List = []
    add_cover_page(story, styles, branding)
    add_table_of_contents(story, styles, toc)
    story.extend(build_story(markdown_files, styles))

    doc.multiBuild(story)
    return output_path


def parse_args(argv: List[str] | None = None):
    parser = argparse.ArgumentParser(description="Generate the consolidated about dossier PDF.")
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=DEFAULT_INPUT_DIR,
        help="Directory containing the markdown chapters (default: docs/01-about)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help=(
            "Output PDF path. If omitted, the PDF will be created in the project 'pdf' directory "
            "and named after the input folder (e.g., 'pdf/01-about.pdf')."
        ),
    )
    return parser.parse_args(argv)


# Removed interactive prompt; scripts now use defaults or CLI args without prompting.


if __name__ == "__main__":  # pragma: no cover
    args = parse_args()
    # Hard-coded default; no interactive prompt. CLI flag still supported.
    input_dir = args.input_dir.expanduser().resolve()
    # Derive default output path from folder name when not provided
    if args.output is None:
        repo_root = Path(__file__).resolve().parents[1]
        output_dir = repo_root / "pdf"
        output_path = output_dir / _derive_filename_from_folder_name(input_dir.name)
    else:
        output_path = args.output

    # Derive document title from folder name and use it for branding
    derived_title = _derive_title_from_folder_name(input_dir.name)
    dynamic_branding = DocumentBranding(
        project_name=derived_title,
        cover_subtitle=DEFAULT_BRANDING.cover_subtitle,
        prepared_for=DEFAULT_BRANDING.prepared_for,
        prepared_by=DEFAULT_BRANDING.prepared_by,
        classification=DEFAULT_BRANDING.classification,
        header_title=f"{derived_title} — Strategic Overview",
        header_date_format=DEFAULT_BRANDING.header_date_format,
        confidentiality_notice=DEFAULT_BRANDING.confidentiality_notice,
        rights_notice_template=DEFAULT_BRANDING.rights_notice_template,
    )

    output_path = generate_pdf(input_dir, output_path.expanduser(), branding=dynamic_branding)
    print(f"Created PDF dossier at: {output_path}")
