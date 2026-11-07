import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, __version__ as pillow_version
from native_rules import chapter_content_pages, has_private_marker

candidate = Path(sys.argv[1]).resolve()
review_dir = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else None
source = json.loads((candidate / "source-manifest.json").read_text(encoding="utf-8"))
if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9-]*", source["stem"]):
    raise SystemExit("Invalid edition filename stem.")
pdf_path = candidate / f"{source['stem']}.pdf"
layout = json.loads((candidate / "layout-report.json").read_text(encoding="utf-8"))
chapters = json.loads((candidate / "chapter-pages.json").read_text(encoding="utf-8"))
root = Path(__file__).resolve().parents[3]
failures = []
preserved_books = source.get("preservedBooks")
if preserved_books is None:
    preserved_books = [source["preservedBook"]]
for item in preserved_books:
    preserved = root / item["path"]
    if hashlib.sha256(preserved.read_bytes()).hexdigest() != item["sha256"]:
        failures.append(f"Preserved edition identity changed: {item['path']}")
document = fitz.open(pdf_path)
if document.page_count != layout["pages"]:
    failures.append("Native PDF page count differs from paginated browser.")
try:
    content_pages = chapter_content_pages(source, document.page_count, chapters)
except ValueError as error:
    raise SystemExit(str(error)) from error
toc = [[1, "Cover", 1], [1, "Contents", layout["pageMap"]["contents"]],
       [1, source["sections"][0]["title"], layout["pageMap"]["orientation"]]]
for part in source["parts"]:
    toc.append([1, f"Part {part['number']} - {part['title']}",
                layout["pageMap"][f"part-{part['number']}"]])
    for chapter in chapters:
        if chapter["part"] == part["number"]:
            toc.append([2, f"{chapter['id']} - {chapter['title']}", chapter["openingPage"]])
for section in source["sections"][1:]:
    toc.append([1, section["title"], layout["pageMap"][section["id"]]])
document.set_toc(toc)
document.set_metadata({
    "title": source["title"],
    "author": "BowserBOY project documentation",
    "subject": source.get("subject", "Independent Nintendo DS development journey and engineering, first NDS edition"),
    "creator": "BowserBOY locked local book production",
    "producer": f"Chromium and PyMuPDF {fitz.VersionBind}",
})
temporary = candidate / "native-reviewed.pdf"
document.save(temporary, garbage=3, deflate=True)
document.close()
temporary.replace(pdf_path)
document = fitz.open(pdf_path)


def normalize(text):
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", text).lower())


native_pages = [page.get_text() for page in document]
normalized_pages = [normalize(text) for text in native_pages]
all_text = "\n".join(native_pages)
body = "".join(document[item["page"] - 1].get_text(
    clip=fitz.Rect(item["rect"]) + (-1.5, -1.5, 1.5, 1.5))
    for item in layout["contentBounds"])
normalized_body = normalize(body)
missing_blocks = [{"page": block["page"], "text": block["text"][:150]}
                  for block in layout["textBlocks"]
                  if normalize(block["text"]) not in normalized_pages[block["page"] - 1]]
missing_source = [text for text in layout["sourceTextBlocks"]
                  if normalize(text) not in normalized_body]
missing_diagram = [text for text in layout["diagramText"]
                   if normalize(text) not in normalized_body]
missing_markers = [marker for marker in source["learningMarkers"] if marker not in all_text]
if missing_blocks or missing_source or missing_diagram or missing_markers:
    failures.append("Native content coverage differs from assembled/paginated source.")
bad_links = []
internal = external = 0
native_overflow = []
for number, page in enumerate(document, 1):
    if abs(page.rect.width - 595.28) > 2 or abs(page.rect.height - 841.89) > 2:
        failures.append(f"Non-A4 page {number}")
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                if span["text"].strip() and not (page.rect + (-1, -1, 1, 1)).contains(fitz.Rect(span["bbox"])):
                    native_overflow.append({"page": number, "text": span["text"][:100]})
    for link in page.get_links():
        if link["kind"] in (fitz.LINK_GOTO, fitz.LINK_NAMED):
            internal += 1
            if not 0 <= link.get("page", -1) < document.page_count:
                bad_links.append({"page": number, "destination": link.get("page")})
            if link["kind"] == fitz.LINK_NAMED:
                expected = layout["pageMap"].get(link.get("nameddest"))
                if expected is None or link.get("page") != expected - 1:
                    bad_links.append({"page": number, "target": link.get("nameddest")})
        elif link["kind"] == fitz.LINK_URI:
            external += 1
            if not re.match(r"^https://", link.get("uri", "")):
                bad_links.append({"page": number, "uri": link.get("uri")})
        else:
            bad_links.append({"page": number, "kind": link["kind"]})
if bad_links or native_overflow:
    failures.append("Native link or page-bounds validation failed.")
for entry in document.get_toc():
    if not 1 <= entry[2] <= document.page_count:
        failures.append(f"Invalid bookmark: {entry[1]}")
fonts = {font[0] for page in document for font in page.get_fonts() if font[0]}
embedded = sum(bool(document.extract_font(xref)[3]) for xref in fonts)
if not embedded:
    failures.append("No embedded native fonts.")
if has_private_marker(all_text):
    failures.append("Unexpected local/private path marker in native book.")
report = {
    "pdfSha256": hashlib.sha256(pdf_path.read_bytes()).hexdigest(),
    "pages": document.page_count, "geometry": "A4", "bookmarks": len(document.get_toc()),
    "chapterContentPages": content_pages, "proseWords": source.get("proseWords"),
    "internalLinks": internal, "externalLinks": external, "badLinks": bad_links,
    "learningMarkers": len(source["learningMarkers"]), "missingLearningMarkers": missing_markers,
    "browserTextBlocks": len(layout["textBlocks"]), "missingTextBlocks": missing_blocks,
    "sourceTextBlocks": len(layout["sourceTextBlocks"]), "missingSourceBlocks": missing_source,
    "diagramLabels": len(layout["diagramText"]), "missingDiagramLabels": missing_diagram,
    "nativeOverflow": native_overflow, "embeddedFonts": embedded,
    "preservedBookSha256": source.get("preservedBook", {}).get("sha256"),
    "preservedBooks": preserved_books,
    "tools": {"PyMuPDF": fitz.VersionBind, "Pillow": pillow_version},
    "failures": failures,
    "visualReview": "Native raster outputs are inspection candidates, not claimed visual review.",
}
(candidate / "pdf-review.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
if failures:
    raise SystemExit("\n".join(failures))
if review_dir:
    review_dir.mkdir(parents=True, exist_ok=True)
    samples = sorted({1, 2, layout["pageMap"]["orientation"], layout["pageMap"]["sources"],
                      *(chapter["startPage"] for chapter in chapters)})
    for number in samples:
        document[number - 1].get_pixmap(matrix=fitz.Matrix(1.3, 1.3)).save(
            str(review_dir / f"native-{number:03d}.png"))
    for offset in range(0, document.page_count, 36):
        count = min(36, document.page_count - offset)
        sheet = Image.new("RGB", (6 * 160, ((count + 5) // 6) * 242), "#d8e2df")
        draw = ImageDraw.Draw(sheet)
        for index in range(count):
            page = document[offset + index]
            pixmap = page.get_pixmap(matrix=fitz.Matrix(.25, .25), alpha=False)
            image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
            image.thumbnail((150, 216))
            x, y = (index % 6) * 160 + 5, (index // 6) * 242 + 5
            sheet.paste(image, (x, y))
            draw.text((x, y + 219), str(offset + index + 1), fill="#203239")
        sheet.save(review_dir / f"contact-{offset // 36 + 1:02d}.png")
print(json.dumps({"pages": document.page_count, "bookmarks": len(document.get_toc()),
                  "nativeContent": "passed", "embeddedFonts": embedded,
                  "pdfSha256": report["pdfSha256"]}))
