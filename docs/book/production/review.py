import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, __version__ as pillow_version

candidate = Path(sys.argv[1]).resolve()
review_dir = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else None
pdf_path = candidate / "Building-a-Little-Escape.pdf"
source = json.loads((candidate / "source-manifest.json").read_text(encoding="utf-8"))
layout = json.loads((candidate / "layout-report.json").read_text(encoding="utf-8"))
chapters = json.loads((candidate / "chapter-pages.json").read_text(encoding="utf-8"))
document = fitz.open(pdf_path)
failures = []
cover_source = Path(__file__).resolve().parents[3] / source["cover"]["path"]
cover_bytes = cover_source.read_bytes()
if hashlib.sha256(cover_bytes).hexdigest() != source["cover"]["sha256"]:
    failures.append("Supplied cover source differs from the assembled edition.")
with Image.open(cover_source) as image:
    expected_cover = image.convert("RGB")
native_cover_match = False
native_cover_fitted = False
for image in document[0].get_images(full=True):
    pixmap = fitz.Pixmap(document, image[0])
    if pixmap.colorspace and pixmap.colorspace.n == 3 and not pixmap.alpha:
        if (pixmap.width, pixmap.height) == expected_cover.size:
            if pixmap.samples == expected_cover.tobytes():
                native_cover_match = True
                page_rect = document[0].rect
                for rect in document[0].get_image_rects(image[0]):
                    native_cover_fitted |= (
                        rect.get_area() >= page_rect.get_area() * 0.99
                        and (page_rect + (-2, -2, 2, 2)).contains(rect)
                    )
if not native_cover_match:
    failures.append("Native first page does not embed the exact supplied cover pixels.")
if not native_cover_fitted:
    failures.append("Supplied cover does not fit the complete native first page.")
if document.page_count != layout["pages"]:
    failures.append("Native PDF page count differs from paginated browser.")
for number, page in enumerate(document, 1):
    if abs(page.rect.width - 595.28) > 2 or abs(page.rect.height - 841.89) > 2:
        failures.append(f"Non-A4 page {number}")

toc = [[1, "Cover", 1], [1, "Contents", layout["pageMap"]["contents"]],
       [1, "Before you pick up the console", layout["pageMap"]["orientation"]]]
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
    "subject": "Second engineering-book edition, November 2026; local delivery",
    "creator": "BowserBOY local book production",
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
missing_markers = [marker for marker in source["learningMarkers"] if marker not in all_text]
if missing_markers:
    failures.append(f"Missing native learning markers: {missing_markers}")
missing_blocks = []
for block in layout["textBlocks"]:
    expected = normalize(block["text"])
    if expected and expected not in normalized_pages[block["page"] - 1]:
        missing_blocks.append({"page": block["page"], "text": block["text"][:150]})
if missing_blocks:
    failures.append(f"Native text coverage failed for {len(missing_blocks)} browser blocks.")
body_text = "".join(document[item["page"] - 1].get_text(
    clip=fitz.Rect(item["rect"]) + (-1.5, -1.5, 1.5, 1.5))
    for item in layout["contentBounds"])
normalized_text = normalize(body_text)
missing_source_blocks = [text for text in layout["sourceTextBlocks"]
                         if normalize(text) not in normalized_text]
missing_diagram_labels = [text for text in layout["diagramText"]
                          if normalize(text) not in normalized_text]
if missing_source_blocks:
    failures.append(f"Native source coverage failed for {len(missing_source_blocks)} original blocks.")
if missing_diagram_labels:
    failures.append(f"Native diagram text missing: {missing_diagram_labels}")
bad_links = []
internal_links = external_links = 0
for number, page in enumerate(document, 1):
    for link in page.get_links():
        if link["kind"] in (fitz.LINK_GOTO, fitz.LINK_NAMED):
            internal_links += 1
            if not 0 <= link.get("page", -1) < document.page_count:
                bad_links.append({"page": number, "destination": link.get("page")})
            if link["kind"] == fitz.LINK_NAMED:
                target = link.get("nameddest")
                expected_page = layout["pageMap"].get(target)
                if expected_page is None or link.get("page") != expected_page - 1:
                    bad_links.append({"page": number, "target": target,
                                      "destination": link.get("page"),
                                      "expectedPage": expected_page})
        elif link["kind"] == fitz.LINK_URI:
            external_links += 1
            if not re.match(r"^https?://", link.get("uri", "")):
                bad_links.append({"page": number, "uri": link.get("uri")})
        else:
            bad_links.append({"page": number, "kind": link["kind"]})
if bad_links:
    failures.append(f"Invalid native link destinations: {len(bad_links)}")
for entry in document.get_toc():
    if not 1 <= entry[2] <= document.page_count:
        failures.append(f"Invalid bookmark: {entry[1]}")

font_records = {}
for page in document:
    for font in page.get_fonts():
        font_records[font[0]] = font[3]
embedded_fonts = sum(bool(document.extract_font(xref)[3]) for xref in font_records if xref)
if not embedded_fonts:
    failures.append("No embedded native fonts found.")
if re.search(r"[A-Za-z]:[\\/]|file://|\.agent-context", all_text):
    failures.append("Unexpected local/private path marker in native book text.")
report = {
    "pdfSha256": hashlib.sha256(pdf_path.read_bytes()).hexdigest(),
    "pages": document.page_count, "geometry": "A4",
    "bookmarks": len(document.get_toc()), "internalLinks": internal_links,
    "externalLinks": external_links, "badLinks": bad_links,
    "learningMarkers": len(source["learningMarkers"]),
    "missingLearningMarkers": missing_markers,
    "browserTextBlocks": len(layout["textBlocks"]), "missingTextBlocks": missing_blocks,
    "sourceTextBlocks": len(layout["sourceTextBlocks"]), "missingSourceBlocks": missing_source_blocks,
    "diagramLabels": len(layout["diagramText"]), "missingDiagramLabels": missing_diagram_labels,
    "embeddedFonts": embedded_fonts,
    "cover": {"sourceSha256": source["cover"]["sha256"], "exactPixelsEmbedded": native_cover_match,
              "fullPageFit": native_cover_fitted,
              "size": list(expected_cover.size),
              "note": "The supplied full-page cover is raster artwork; its lettering is not native searchable text."},
    "tools": {"PyMuPDF": fitz.VersionBind, "Pillow": pillow_version},
    "failures": failures,
    "visualReview": "Raster outputs are review candidates, not an assertion that all pages were read.",
}
(candidate / "pdf-review.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
if failures:
    raise SystemExit("\n".join(failures))
if review_dir:
    review_dir.mkdir(parents=True, exist_ok=True)
    sample_pages = sorted(set([1, 2, layout["pageMap"]["part-1"],
                              chapters[0]["startPage"] + 1,
                              chapters[3]["startPage"],
                              chapters[6]["startPage"],
                              chapters[10]["startPage"],
                              chapters[11]["startPage"],
                              chapters[12]["startPage"],
                              chapters[13]["endPage"],
                              document.page_count]))
    for number in sample_pages:
        document[number - 1].get_pixmap(matrix=fitz.Matrix(1.5, 1.5)).save(
            str(review_dir / f"native-{number:03d}.png"))
    per_sheet = 48
    for offset in range(0, document.page_count, per_sheet):
        count = min(per_sheet, document.page_count - offset)
        sheet = Image.new("RGB", (6 * 160, ((count + 5) // 6) * 242), "#d8d2dc")
        draw = ImageDraw.Draw(sheet)
        for index in range(count):
            number = offset + index
            pixmap = document[number].get_pixmap(matrix=fitz.Matrix(.25, .25), alpha=False)
            image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
            x, y = (index % 6) * 160, (index // 6) * 242
            sheet.paste(image, (x + 5, y + 22))
            draw.text((x + 6, y + 5), f"Page {number + 1}", fill="#26212b")
        sheet.save(review_dir / f"contact-{offset // per_sheet + 1:02d}.png")
    (review_dir / "inspection-candidates.json").write_text(
        json.dumps({"nativeSamples": sample_pages, "pages": document.page_count,
                    "status": "generated; awaiting bounded visual inspection"}, indent=2),
        encoding="utf-8")
print(json.dumps({key: report[key] for key in
                  ["pages", "bookmarks", "internalLinks", "browserTextBlocks", "embeddedFonts", "failures"]}))
document.close()
