"""Generate a consolidated Systems PDF from docs/03-systems.

This script compiles the Systems documentation where each subsystem lives in its
own folder with a `readme.md`. It reuses the rendering engine from
`scripts/generate_about_pdf.py` (cover page, TOC, headings, tables, lists) and
just changes how markdown sources are collected.

Usage:
  python scripts/generate_systems_pdf.py [--input-dir docs/03-systems] [--output <path>]

Defaults:
  - Input directory: docs/03-systems
  - Output path: pdf/<folder-name>.pdf (e.g., pdf/03-systems.pdf)
"""
from __future__ import annotations

import argparse
import importlib.util
from pathlib import Path
from typing import List


DEFAULT_INPUT_DIR = Path("docs/03-systems")


def _load_about_module():
    """Dynamically import the rendering helpers from generate_about_pdf.py.

    We avoid duplicating ~800 lines of layout and parsing logic by importing the
    existing generator as a module and reusing its functions/classes.
    """
    about_path = Path(__file__).parent / "generate_about_pdf.py"
    if not about_path.exists():
        raise FileNotFoundError(
            f"Expected '{about_path}' to exist so we can reuse its PDF renderer."
        )
    spec = importlib.util.spec_from_file_location("about_pdf", str(about_path))
    if spec is None or spec.loader is None:  # pragma: no cover - defensive
        raise ImportError("Unable to load PDF renderer module from generate_about_pdf.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[assignment]
    return module


def collect_system_markdown_files(input_dir: Path, include_root_readme: bool = True) -> List[Path]:
    """Collect markdown files for the Systems PDF.

    Rules:
    - Optionally include the root `readme.md` at the start when present.
    - Then include each child folder's `readme.md`, ordered lexicographically
      (works with `01-`, `02-` prefixes used in this repo).
    - Ignore other files.
    """
    if not input_dir.exists():
        raise FileNotFoundError(f"Input directory '{input_dir}' does not exist")

    files: List[Path] = []

    root_readme = input_dir / "readme.md"
    if include_root_readme and root_readme.exists():
        files.append(root_readme)

    for child in sorted(p for p in input_dir.iterdir() if p.is_dir()):
        readme = child / "readme.md"
        if readme.exists():
            files.append(readme)

    if not files:
        raise FileNotFoundError(
            f"No subsystem readme.md files found under '{input_dir}'."
        )
    return files


def parse_args(argv: list[str] | None = None):
    parser = argparse.ArgumentParser(
        description="Generate the consolidated Systems PDF from docs/03-systems"
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=DEFAULT_INPUT_DIR,
        help="Root directory containing subsystem folders (default: docs/03-systems)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help=(
            "Output PDF path. If omitted, the PDF is written to the repo 'pdf' "
            "folder and named after the input directory (e.g., 'pdf/03-systems.pdf')."
        ),
    )
    return parser.parse_args(argv)


def generate_systems_pdf(input_dir: Path, output_path: Path) -> Path:
    about = _load_about_module()

    styles = about.build_styles()
    about.reset_heading_slug_tracking()
    markdown_files = collect_system_markdown_files(input_dir, include_root_readme=True)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.exists():
        if output_path.is_dir():
            raise IsADirectoryError(
                f"Output path '{output_path}' is a directory, expected a file path."
            )
        output_path.unlink()

    # Title derived from folder name (e.g., '03-systems' -> 'Systems') for branding
    derived_title = about._derive_title_from_folder_name(input_dir.name)
    branding = about.DocumentBranding(
        project_name=derived_title,
        cover_subtitle=about.DEFAULT_BRANDING.cover_subtitle,
        prepared_for=about.DEFAULT_BRANDING.prepared_for,
        prepared_by=about.DEFAULT_BRANDING.prepared_by,
        classification=about.DEFAULT_BRANDING.classification,
        header_title=f"{derived_title} — Strategic Overview",
        header_date_format=about.DEFAULT_BRANDING.header_date_format,
        confidentiality_notice=about.DEFAULT_BRANDING.confidentiality_notice,
        rights_notice_template=about.DEFAULT_BRANDING.rights_notice_template,
    )

    doc = about.AboutDocTemplate(output_path, branding)
    toc = about.TableOfContents()
    about.configure_toc_tracking(doc, styles)

    story: list = []
    about.add_cover_page(story, styles, branding)
    about.add_table_of_contents(story, styles, toc)
    story.extend(about.build_story(markdown_files, styles))

    doc.multiBuild(story)
    return output_path


def main():  # pragma: no cover - CLI entry
    about = _load_about_module()
    args = parse_args()

    # Prompt (with default) for the systems directory path
    input_dir = about.prompt_for_input_dir(args.input_dir).resolve()

    # Derive output path when not specified
    if args.output is None:
        repo_root = Path(__file__).resolve().parents[1]
        output_dir = repo_root / "pdf"
        output_path = output_dir / about._derive_filename_from_folder_name(input_dir.name)
    else:
        output_path = args.output.expanduser()

    final_path = generate_systems_pdf(input_dir, output_path)
    print(f"Created Systems PDF at: {final_path}")


if __name__ == "__main__":
    main()

