# First NDS edition: production and review

Reviewed November 7, 2026. **Two Screens, One Little Escape** is an independent
DS development-journey and engineering book, not a replacement or revision of
the preserved GBA book.

## Exact edition

| Property | Result |
|---|---|
| PDF | 85 native A4 pages; 3,789,334 bytes |
| Chapters / parts | 13 / 4 |
| Rendered diagrams / illustrations | 13 / 4 captioned first-frame stills |
| Learning markers | 52: worked examples, changed-condition retries, questions and explained answers |
| PDF bookmarks / links | 21 bookmarks; 58 internal and 143 HTTPS links |
| Native fonts | 7 embedded fonts |
| Checked implementation/history files | 45 at the pinned implementation revision |
| Source blocks / paginated blocks / diagram labels | 598 / 605 / 158, all covered in native PDF text |
| Minimum rendered diagram label | 8.5749 pt; the 8 pt minimum was retained |
| Layout / native failures | No overflow, blank pages, missing images, unresolved anchors, missing source blocks, missing markers or bad native links |
| Offline HTML | 85 pages; embedded images; zero scripts, missing anchors or external resource requests |

PDF SHA256:
`0e6c1e5a422c32fe87d9ff968379f2f93cbe9ac8213d3d813ae70eb0ce85567f`.

Offline HTML SHA256:
`fec54ba4ce2733d4b17ee772ebfc0c5e3c8937cba6beb72bb00d18ead707b894`.

Implementation cutoff:
`61845372142b41992916f3732ea102cc0f4c8edf`.
This is the runtime/history revision, not the later book-publication commit.
The source manifest separately hashes actual manuscript, illustration and
production inputs. It does not claim that uncommitted authoring already
existed at the implementation cutoff.

The preserved `Building-a-Little-Escape.pdf` still has SHA256
`25875beab7d925f9d014de89842b560216729c799e673f5a7218291aa75db1ad`.
The original book sources, frozen edition and supplied artwork were not
replaced. Nine unrelated dirty historical PNGs remained outside this change.

## Actual review, not just generated review images

Three contact sheets covering all 85 pages were inspected for gross
composition, chapter progression, illustration placement and unintended blank
pages. Native-resolution raster pages **1, 2, 26, 38, 51, 80 and 83** were then
inspected: cover, contents, a long loading diagram, controls/explained-answer
navigation, captioned lighting illustration, continued diagnostic table and
source register. Text, arrows, captions and margins are visibly contained in
those selected pages. This is a bounded visual review, not a claim that every
page was read at native resolution or that a human approved the edition.

The first render correctly rejected image captions sharing their image's
Markdown paragraph. Blank-line separation fixed the source rather than
weakening the caption gate. A later render rejected undersized diagram
labels. Concise node labels retained the causal steps, while restoring the
shared 180 mm figure allowance kept readable labels without shrinking type
or changing the 8 pt gate. The final successful render is the exact hash above.

The shared publishing regression suite passed all four cases, including
NDS learning-ID pairing and cross-book marker rejection. Repository JavaScript
syntax checks also passed. No dependency installation was needed.

## Reproduce from the repository root

The repository's separate production lockfile and installed local toolchain
are used. If those dependencies are missing, restore the production directory's
locked dependencies with `npm ci`; do not replace the application's lockfile.
An installed supported Chromium browser is required; set `BOOK_BROWSER` only
when automatic discovery cannot find one.

```powershell
node --test docs\book\production\production.test.mjs
node docs\book\production\build-nds.mjs
node docs\book\production\render.mjs --nds
```

Set `BOOK_REVIEW_DIR` to an explicitly chosen private output directory before
rendering when contact sheets/native raster candidates are required. Generating
those images is not itself visual review. The NDS branch writes only its
independent `.nds-candidate` and `docs\nds-book\output\2026-11` paths; the
default GBA production branch keeps its existing inputs and destinations.

The deliverable PDF/reader were copied unchanged into `published`. Its
edition manifest records the subsequent bounded visual review and the
repository-artifact delivery boundary; its checksums cover the actual promoted
files. A future rebuild creates new candidate bytes and requires a new review;
it must not silently overwrite this edition or inherit these visual claims.

## Scope and remaining limits

The book covers DS lifecycle, pinned EmulatorJS/DeSmuME integration, two native
screens, touch and input ownership, saves, geometry, lighting, algorithms,
design principles, visual evidence and causal release history. Shared systems
appear only where relevant to DS. It does not include GBA hardware/runtime
chapters, a DS CPU tutorial, private conversations, ROMs, BIOS or firmware.

The four illustrations are metadata-clean frame-zero PNG derivatives of
already published GIFs. Still frames do not prove motion. Capture-only LCD
replay does not demonstrate live native input response. Original GIF/capture
provenance and the distinction between scene action and recorded opening
remain explicit in the manuscript.

Source verification is not a new game-compatibility or device qualification.
The historical hosted result remains **119 declared / 98 PASS / 21 SKIP /
0 FAIL / 0 UNRUN** at the cutoff; the 21 parked cases remain coverage debt.
This publication does not repair or remove them.

This is not a fresh-machine rebuild, byte-for-byte reproducibility proof,
PDF/UA conformance, printer-prepress qualification or independent rights audit.
HTTPS link syntax/destinations were checked structurally; availability of
every external target was not requalified. PDF contents/bookmarks, offline
anchors and the mechanical reports provide the bounded navigation evidence.

The book is a separately tracked GitHub repository artifact. It is not added
to the emulator's allowlisted Pages application payload. GitHub renders the
Markdown reading route; download the HTML for the self-contained reader.
Publication and deployment receipts belong in workstream 122 and the
development ledger rather than being inferred from local rendering.
