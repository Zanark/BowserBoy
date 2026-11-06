# Building a Little Escape - BookMaker edition

The second edition combines the ten existing teaching chapters with new
worked examples, changed-condition retries and explained exercises, then adds
three current engineering chapters and a capstone. It is an illustrated,
locally rendered learning book, not an exhaustive source atlas.

The first Markdown edition remains in `book/chapters`; its source pin and
historical evidence are preserved. New interpretation is explicitly labeled.
The first public milestone is **v1.0.0, November 6, 2026, Asia/Kolkata**.
That milestone is not the same thing as an exercised GitHub Release workflow.

## Reader and source

Generated delivery: `book/output/2026-11/index.html`,
`Building-a-Little-Escape.pdf` and `Reading-Edition.html`.
The HTML reader embeds diagrams and images; it needs no renderer or network
to open. It is a fixed-page reading edition, not a responsive mobile textbook.
Outputs are local generated files, not a Pages deployment. The reviewed PDF
is also copied to [the repository reading copy](../../published/Building-a-Little-Escape.pdf)
with [its checksum](../../published/SHA256SUMS.txt), ready for repository
publication and attachment to manually qualified GitHub Releases.

Canonical additions are this directory's Markdown. `catalogue.mjs` explicitly
selects chapters, supplements and image inputs. The build hashes its reviewed
sources and records implementation revision and dirty-worktree boundaries.
No context store, raw chat, ROM, private recording or sibling manuscript is
an input.

## Build locally

From `book/production`, use Node >=22, Python with the pinned packages in
`requirements.txt`, and an installed Chromium browser:

```powershell
npm ci --no-audit --no-fund
$env:BOOK_BROWSER = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm run book
```

Only restore dependencies when missing or after a manifest change. If the
Python dependencies are missing, use
`python -m pip install -r requirements.txt`.
The JavaScript lockfile is independent of the application's root lockfile.
The renderer uses the selected browser; it does not download one.

The pipeline checks source paths and learning IDs, assembles HTML, renders
Mermaid locally, paginates with Paged.js, checks actual page containers, creates
the PDF, then uses PyMuPDF for native text/links/outline/geometry inspection.
It writes a candidate separately and promotes only after mechanical gates.
Selected native-page images and a contact sheet are kept in the current
session's review directory, outside the reader delivery.

`edition-manifest.json`, `layout-report.json`, `pdf-review.json`,
`chapter-pages.json`, `source-manifest.json` and `SHA256SUMS.txt` identify the
exact result. Generated files are not editable sources. Rebuilding can change
pagination with browser/font versions; byte-for-byte reproducibility and a
fresh-machine dependency installation are not claimed.

## Provenance and boundaries

The current full-page cover is the owner's supplied
`Blueprint BowserBoy Advance Cover.png`, retained as `cover.png` without
regeneration, recoloring or cropping. The native PDF check verifies its exact
RGB pixels are embedded on page1. Its lettering is raster artwork, not
searchable native text; the rest of the book remains searchable. At1055x1491,
the supplied artwork is approximately128DPI at A4, not a300DPI master.
The earlier authored `cover.svg` and its review remain historical references.
The cover does not establish a publisher affiliation or rights clearance.
Existing project screenshots retain the notices in
[THIRD_PARTY_NOTICES.md](../../../THIRD_PARTY_NOTICES.md).
Supplied logos and game footage are not independently licensed by this book.
An animated source is represented by a labeled still for print; its motion
must be inspected in the separately documented application media.

Fonts use the installed Georgia/Arial/Consolas families through Chromium;
font files are not shipped with the reader. A different system may substitute
fonts in HTML. The native PDF embeds the fonts chosen by the local renderer.
This is not a PDF/UA, printer-ready, legal-rights or human aesthetic certification.
The owner requested a README cover/link and release companion. The repository
PDF becomes public when these changes are pushed; the release workflow attaches
that reviewed PDF separately from the application ZIP. It does not rebuild the
book, rewrite the frozen application package or bypass source qualification.
