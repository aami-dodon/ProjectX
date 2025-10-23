#!/usr/bin/env python3
import os
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SYSTEMS_DIR = ROOT / "docs/03-systems"


# Canonical roles derived from RBAC docs
ROLES = [
    "Admin",
    "Compliance Officer",
    "Engineer",
    "Auditor",
]


# Minimal font loader with fallbacks
def load_font(size=16):
    candidates = [
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/Library/Fonts/Arial.ttf",
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, size)
            except Exception:
                continue
    return ImageFont.load_default()


TITLE_FONT = load_font(28)
SUBTITLE_FONT = load_font(18)
BODY_FONT = load_font(14)
SMALL_FONT = load_font(12)


def _text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont):
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        return bbox[2] - bbox[0], bbox[3] - bbox[1]
    except Exception:
        try:
            return font.getsize(text)
        except Exception:
            return len(text) * 8, 16


def draw_chip(draw: ImageDraw.ImageDraw, xy, text, fill=(30, 60, 80), text_fill=(200, 230, 255)):
    x, y = xy
    w, h = _text_size(draw, text, SMALL_FONT)
    pad_x, pad_y = 10, 6
    rect = (x, y, x + w + pad_x * 2, y + h + pad_y * 2)
    draw.rounded_rectangle(rect, radius=12, fill=fill)
    draw.text((x + pad_x, y + pad_y), text, fill=text_fill, font=SMALL_FONT)
    return rect[2] + 8, rect[3]  # next x, bottom


def draw_card(draw: ImageDraw.ImageDraw, rect, title, lines=None):
    (x1, y1, x2, y2) = rect
    draw.rounded_rectangle(rect, radius=16, outline=(70, 85, 100), width=2, fill=(22, 30, 40))
    draw.text((x1 + 16, y1 + 14), title, fill=(220, 235, 250), font=SUBTITLE_FONT)
    if lines:
        ly = y1 + 48
        for ln in lines:
            draw.text((x1 + 18, ly), f"• {ln}", fill=(180, 200, 220), font=BODY_FONT)
            ly += 22


def draw_sidebar(draw: ImageDraw.ImageDraw, title="PROJECT X"):
    # static left sidebar
    draw.rectangle((0, 0, 240, 900), fill=(15, 20, 28))
    draw.text((24, 24), title, fill=(220, 235, 250), font=SUBTITLE_FONT)
    # Sections
    sections = [
        ("OVERVIEW", [
            "Executive Dashboard", "Control Library", "Evidence",
            "Remediation Tasks", "Reports & Exports"
        ]),
        ("OPERATIONS", [
            "Framework Mapping", "Probe Integrations", "Administration"
        ]),
    ]
    y = 70
    for header, items in sections:
        draw.text((24, y), header, fill=(110, 125, 145), font=SMALL_FONT)
        y += 20
        for it in items:
            draw.rounded_rectangle((16, y, 224, y + 34), radius=10, fill=(22, 30, 40))
            draw.text((28, y + 8), it, fill=(170, 190, 210), font=BODY_FONT)
            y += 42


def dark_canvas(width=1400, height=900):
    img = Image.new("RGB", (width, height), color=(10, 14, 20))
    draw = ImageDraw.Draw(img)
    return img, draw


def header(draw: ImageDraw.ImageDraw, title, subtitle=""):
    draw.text((260, 28), title, fill=(235, 245, 255), font=TITLE_FONT)
    if subtitle:
        draw.text((260, 64), subtitle, fill=(160, 180, 200), font=BODY_FONT)


def role_permissions(role: str):
    base = {
        "Admin": ["Create, edit, delete", "Policy & tenant settings", "Export + audit override"],
        "Compliance Officer": ["Approve/attest", "Manage evidence links", "Export datasets"],
        "Engineer": ["Create/update entities", "View metrics & logs", "Trigger probes/checks"],
        "Auditor": ["Read-only access", "Download with trace", "Request clarifications"],
    }
    return base.get(role, ["View only"])  # default fallback


SYSTEM_SCREENS = {
    "01-user-management-system": {
        "screen": "User & Session Management",
        "sections": [
            ("User Directory", ["Search, sort, filter", "Invite user, deactivate", "Last active, MFA state"]),
            ("Security Settings", ["MFA enrollment", "Password resets", "Device & session list"]),
            ("Session Governance", ["JWT refresh, revoke", "Break-glass override", "Recent login locations"]),
        ],
        "component": "UserRowActions",
    },
    "02-rbac-system": {
        "screen": "Administration & RBAC",
        "sections": [
            ("User & Role Management", ["Role assignments", "Teams & domains", "Last activity"]),
            ("Policy Controls", ["Casbin policies", "ABAC conditions", "Dry-run preview"]),
            ("Audit Trail", ["Policy changes", "Reviewer sign-off", "Checksums"]),
        ],
        "component": "RoleMatrix",
    },
    "03-document-and-media-upload": {
        "screen": "Document & Media Upload",
        "sections": [
            ("Upload Wizard", ["Drag & drop", "Checksum verification", "Virus scan status"]),
            ("Metadata", ["Title, tags", "Retention policy", "Control/Check links"]),
            ("Completion", ["Integrity receipt", "Audit log reference", "Next actions"]),
        ],
        "component": "UploadWizard",
    },
    "04-notification-system": {
        "screen": "Notification Center",
        "sections": [
            ("Delivery Channels", ["Email, Slack, Webhook", "Templates & throttling", "Failure retries"]),
            ("Subscribers", ["RBAC-scoped topics", "Escalation ladders", "Quiet hours"]),
            ("Logs", ["Sent, failed, retries", "Provider metrics", "Audit export"]),
        ],
        "component": "TemplateEditor",
    },
    "05-admin-and-configuration-system": {
        "screen": "Administration Settings",
        "sections": [
            ("Tenant Settings", ["Branding, locales", "Data residency", "Feature toggles"]),
            ("Identity & SSO", ["SAML/OIDC", "MFA policy", "Session timeout"]),
            ("API & Keys", ["Service accounts", "Token scopes", "Rotation policy"]),
        ],
        "component": "TenantSettings",
    },
    "06-audit-logging-and-monitoring": {
        "screen": "Audit Logging & Monitoring",
        "sections": [
            ("Log Stream", ["Structured JSON", "Actor, action, target", "Integrity signature"]),
            ("Filters & Search", ["Time range, actor", "Module, severity", "Export selection"]),
            ("Health & Alerts", ["Ingestion latency", "Queue depth", "PagerDuty hooks"]),
        ],
        "component": "AuditLogTable",
    },
    "07-probe-management-system": {
        "screen": "Probe & Integration Hub",
        "sections": [
            ("Active Probes", ["Connected system", "Cadence", "Status & last run"]),
            ("Ingestion Timeline", ["Streaming events", "Backfill jobs", "Error spikes"]),
            ("Credential Vault", ["Service accounts", "Pending rotations", "Last audit"]),
        ],
        "component": "ProbeRow",
    },
    "08-check-management-system": {
        "screen": "Check Management",
        "sections": [
            ("Check Catalog", ["Automated vs manual", "Severity & owner", "Linked controls"]),
            ("Schedules", ["Cron & triggers", "SLAs", "Dependencies"]),
            ("Run History", ["Latest outcomes", "Artifacts", "Issue links"]),
        ],
        "component": "CheckDetails",
    },
    "09-control-management-system": {
        "screen": "Control Library",
        "sections": [
            ("Control Inventory", ["Framework coverage", "Linked checks", "Status"]),
            ("Coverage Matrix", ["Framework x Control", "Heatmap", "Gaps"]),
            ("Lifecycle", ["Draft → Approved", "Revision history", "Attestations"]),
        ],
        "component": "ControlRow",
    },
    "10-framework-mapping-system": {
        "screen": "Framework Mapping Studio",
        "sections": [
            ("Framework Catalog", ["Domains", "Controls mapped", "Status"]),
            ("Control Alignment", ["Graph alignment", "Open alignment", "Coverage"]),
            ("Change Log", ["Version notes", "ADR links", "Download"]),
        ],
        "component": "MappingRow",
    },
    "11-evidence-management-system": {
        "screen": "Evidence Repository",
        "sections": [
            ("Evidence Summary", ["Freshness SLA", "Artifacts count", "Histogram"]),
            ("Filters", ["Framework, Control", "Type, Retention", "Saved views"]),
            ("Evidence Inventory", ["Artifact, Linked control", "Source", "Status"]),
        ],
        "component": "EvidenceRow",
    },
    "12-governance-engine": {
        "screen": "Governance Engine",
        "sections": [
            ("Rules Matrix", ["Control → Checks", "Signals", "Actions"]),
            ("Pipelines", ["Ingestion → Decision", "Queues", "Backpressure"]),
            ("Exceptions", ["Waivers", "Compensating controls", "Expiry"]),
        ],
        "component": "RuleRow",
    },
    "13-task-management-system": {
        "screen": "Remediation Task Workspace",
        "sections": [
            ("Task Board", ["Open, Pending verification", "SLA breaches", "Kanban view"]),
            ("Escalation Timeline", ["Levels 1-3", "Notifications", "Verification queue"]),
            ("Task Inbox", ["Owner", "Due date", "Status"]),
        ],
        "component": "TaskRow",
    },
    "14-dashboard-and-reporting-system": {
        "screen": "Executive Dashboard",
        "sections": [
            ("Total Compliance", ["Across frameworks", "Weighted by criticality", "Last updated"]),
            ("Risk & Escalations", ["Open findings", "High risk controls", "Exec escalations"]),
            ("Framework Scorecard", ["EU AI Act", "ISO 42001", "NIST AI RMF"]),
        ],
        "component": "ScoreGauge",
    },
    "15-external-integrations-system": {
        "screen": "External Integrations",
        "sections": [
            ("Catalog", ["Registered apps", "Capabilities", "Status"]),
            ("API Keys", ["Scopes", "Last used", "Rotate"]),
            ("Webhooks", ["Endpoints", "Failures", "Retry policy"]),
        ],
        "component": "IntegrationRow",
    },
}


def make_overview_image(system_key: str, out_path: Path):
    spec = SYSTEM_SCREENS[system_key]
    img, draw = dark_canvas()
    draw_sidebar(draw)
    header(draw, spec["screen"], subtitle="Mock UI • Reference layout • Not real data")

    # action buttons chips (top-right)
    nx, _ = draw_chip(draw, (1040, 28), "Primary Action")
    nx, _ = draw_chip(draw, (nx, 28), "Secondary")

    # main grid
    x0, y0 = 260, 100
    w, h, gap = 520, 250, 22
    cards = [
        (x0, y0, x0 + w, y0 + h),
        (x0 + w + gap, y0, x0 + 2 * w + gap, y0 + h),
        (x0, y0 + h + gap, x0 + w, y0 + 2 * h + gap),
        (x0 + w + gap, y0 + h + gap, x0 + 2 * w + gap, y0 + 2 * h + gap),
    ]
    for idx, rect in enumerate(cards):
        title = spec["sections"][idx % len(spec["sections"])][0]
        lines = spec["sections"][idx % len(spec["sections"])][1]
        draw_card(draw, rect, title, lines)

    img.save(out_path)


def make_component_role_image(system_key: str, role: str, out_path: Path):
    spec = SYSTEM_SCREENS[system_key]
    comp_name = spec["component"]
    img, draw = dark_canvas(width=900, height=520)
    draw.rectangle((0, 0, 900, 520), fill=(10, 14, 20))
    draw.text((20, 16), f"{comp_name} — {role}", fill=(235, 245, 255), font=SUBTITLE_FONT)
    # component frame
    draw.rounded_rectangle((20, 60, 880, 480), radius=14, outline=(75, 90, 110), width=2, fill=(20, 26, 36))

    # role abilities panel
    draw_card(draw, (36, 78, 420, 300), "Role capabilities", role_permissions(role))

    # interaction panel (generic)
    comp_lines = {
        "UserRowActions": ["View profile", "Edit/MFA reset", "Deactivate"],
        "RoleMatrix": ["Assign role", "Edit policy", "Dry-run deny"],
        "UploadWizard": ["Select files", "Compute checksum", "Submit"],
        "TemplateEditor": ["Subject/body", "Variables", "Preview"],
        "TenantSettings": ["Branding", "Locale/timezone", "Save"],
        "AuditLogTable": ["Filter", "View details", "Export"],
        "ProbeRow": ["Health", "Cadence", "Rotate key"],
        "CheckDetails": ["Definition", "Run now", "Link control"],
        "ControlRow": ["Coverage", "Linked checks", "Lifecycle"],
        "MappingRow": ["Domains", "Mapped controls", "Status"],
        "EvidenceRow": ["Download", "Link to control", "Verify"],
        "RuleRow": ["When/If/Then", "Signals", "Action"],
        "TaskRow": ["Assign", "Add evidence", "Change status"],
        "ScoreGauge": ["Score", "Trend", "Drilldown"],
        "IntegrationRow": ["Scopes", "Rotate", "Ping"],
    }
    draw_card(draw, (440, 78, 864, 300), f"{comp_name} interactions", comp_lines.get(comp_name, ["Action A", "Action B"]))

    # footer note
    draw.text((36, 320), "Notes:", fill=(190, 205, 225), font=BODY_FONT)
    notes = [
        "Mock layout; content derived from system docs.",
        "Use RBAC to show/hide actions per role.",
    ]
    y = 344
    for n in notes:
        draw.text((48, y), f"• {n}", fill=(160, 180, 200), font=BODY_FONT)
        y += 22

    img.save(out_path)


def composite_preview(system_key: str, out_path: Path, images: list):
    # Create a 2x2 grid composite with labels
    W, H = 1400, 900
    img = Image.new("RGB", (W, H), color=(10, 14, 20))
    draw = ImageDraw.Draw(img)
    draw_sidebar(draw)
    title = SYSTEM_SCREENS[system_key]["screen"] + " — Preview"
    header(draw, title, subtitle="Screen + per-role component snapshots")

    # paste up to 3 thumbnails (roles)
    thumb_w, thumb_h = 420, 240
    x0, y0 = 260, 110
    gap = 24
    positions = [
        (x0, y0),
        (x0 + thumb_w + gap, y0),
        (x0, y0 + thumb_h + gap),
        (x0 + thumb_w + gap, y0 + thumb_h + gap),
    ]

    for (thumb, (px, py)) in zip(images, positions):
        try:
            t = Image.open(thumb).resize((thumb_w, thumb_h))
            img.paste(t, (px, py))
            draw.rounded_rectangle((px, py, px + thumb_w, py + thumb_h), radius=8, outline=(70, 85, 100), width=1)
        except Exception:
            # draw placeholder if missing
            draw_card(draw, (px, py, px + thumb_w, py + thumb_h), "Preview unavailable", [str(thumb)])

    img.save(out_path)


def extract_has_frontend_sections(readme_path: Path) -> bool:
    txt = readme_path.read_text(encoding="utf-8", errors="ignore")
    return bool(re.search(r"Frontend Specification|Reusable Components & UI Flows", txt, re.IGNORECASE))


def ensure_issues(system_dir: Path, has_frontend: bool):
    issues_file = system_dir / "issues.txt"
    notes = []
    if not has_frontend:
        notes.append("Missing 'Frontend Specification' / 'Reusable Components & UI Flows' details. Needed: exact widgets, table columns, actions, role-specific visibility rules.")
    if notes:
        content = "\n".join(notes) + "\n"
        issues_file.write_text(content, encoding="utf-8")
    else:
        # clear existing issues if any
        if issues_file.exists():
            issues_file.unlink()


def main():
    for system_dir in sorted(SYSTEMS_DIR.glob("[0-9][0-9]-*/")):
        key = system_dir.name.rstrip("/")
        if key not in SYSTEM_SCREENS:
            # Skip systems that are not mapped (defensive)
            continue
        readme = system_dir / "readme.md"
        has_frontend = extract_has_frontend_sections(readme) if readme.exists() else False
        ensure_issues(system_dir, has_frontend)

        # Create images
        overview_path = system_dir / f"{SYSTEM_SCREENS[key]['screen'].replace(' ', '-')}.png"
        make_overview_image(key, overview_path)

        # per-role component images (generate for all roles)
        thumb_paths = []
        for role in ROLES:
            comp_path = system_dir / f"{SYSTEM_SCREENS[key]['component']}-{role.replace(' ', '')}.png"
            make_component_role_image(key, role, comp_path)
            # collect first three for preview collage
            if len(thumb_paths) < 3:
                thumb_paths.append(comp_path)

        # composite preview
        composite = system_dir / "preview.png"
        composite_preview(key, composite, thumb_paths)

        print(f"Generated: {overview_path}")
        print(f"Generated composite: {composite}")


if __name__ == "__main__":
    main()
