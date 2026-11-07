# Modeling handbook: qualification and delivery

## Exact qualified edition

The November 8, 2026 supplied-cover revision of **From Shapes to a Living Desk**
contains **328 A4 pages with searchable interiors**, including
**268 unique chapter-content pages**, 38 chapters, 63,587 explanatory prose words,
76 rendered diagrams and 152 worked-example, retry, question and answer markers.
The 200-page depth gate excludes covers, part/chapter openers and references.

- PDF SHA-256: `7924b81ab067bfeff283d53c052f7baf461e51226439b219a1660aecc07cc746`
- Offline reader SHA-256: `29fec7114bd43c9c3e7aa4f1daba88959c1c9e37eef4a59d6593a18707342f73`
- Implementation cutoff: `1e4ef518d6943ab1af39cef3b4d558f209a17891`.
- Exact later authoring/production inputs: [source manifest](published/source-manifest.json).
- Construction/research receipts: [source register](SOURCES.md) and four
  [coverage inventories](coverage/).

## Mechanical qualification

The complete browser layout and native PDF pass text coverage, diagram-label,
image, internal-anchor, page-bounds and blank-page gates. Native checks account
for 1,977 source text blocks, 2,008 browser text blocks, 416 diagram labels,
159 internal links, 484 HTTPS links, 47 bookmarks and seven embedded fonts.
There are no missing source blocks, missing learning markers, missing diagram
labels, invalid link destinations or native overflows. HTTPS syntax and recorded
source spans are checked; this is not a continuous availability audit of every
external research page. The smallest measured diagram text is 13.6558 pt;
body typography remains 11 pt / 1.46.

The scriptless offline reader independently opens all 328 pages with decoded
images, intact internal destinations, zero scripts and zero external requests.
It is a fixed A4 reading edition, not a responsive ebook or PDF/UA claim.

The first 327-page attempt was rejected for ten overflow observations across
three fragmented preformatted recipes. Keeping complete recipe blocks together
in the modeling-only stylesheet resolves the pagination problem; the accepted
328-page rerender passes the unchanged gates. No font reduction, clipping,
missing-text exemption or relaxed overflow tolerance was used.

## Actual inspection scope

For the original edition, all 328 pages were inspected as thumbnails across ten native-PDF contact sheets.
This checks composition, figure placement, obvious clipping and page rhythm,
not word-by-word readability. Native-resolution pages **1, 35, 70, 277 and 293**
were additionally inspected: original cover, representative geometry prose and
all three formerly fragmented recipes. Those recipes are complete and readable.
The ten sheets show distinct part/chapter openings, consistently vertical
construction diagrams, intact captions and no obviously clipped model plates.

The current revision replaces page one with the owner's unchanged
[supplied artwork](assets/cover.png), fitted without cropping. Its "Second Edition"
lettering does not imply rewritten chapters. The raster cover is not searchable.
The new native cover was inspected. All **327 interior pages** are pixel-identical
at 1.3x native raster scale to the previously published edition, with exact
extracted text, link rectangles/destinations and bookmarks. Link comparison
excludes regenerated PDF cross-reference object IDs only.
The [current equivalence receipt](published/final-page-equivalence.json) carries
the bounded interior inspection forward, not a second full human review.
Edge also decoded the offline reader's byte-identical supplied cover, with
328 pages, zero scripts and zero external requests. Exact current hashes appear above.

The final 18-view original-factory atlas was inspected separately as a contact
sheet. Its neutral studio disables model lights and material emission; it does
not demonstrate powered lamps, animation, historical artwork, gameplay or
application-room photometry.

Four chapter authors read the implementation and verified their cited history
and consulted research. Integration checked all 65 distinct pinned source files
and reviewed representative LCD, projection, companion and scene chapters.
This does not mean every paragraph received a second independent semantic review.
Automatic assertions and this bounded visual inspection are not owner aesthetic
acceptance, which has not been requested or inferred.

## Preservation and distribution

The frozen GBA PDF retains its recorded hash. The NDS book deliberately receives
its own supplied-cover revision; this modeling build preserves that finalized
NDS PDF and offline reader at their new exact hashes. Both previous editions
remain available at immutable commit `c61346594396c115a0eec29d656866a0c57ece57`.
No ROM, firmware, raw footage,
private context, social source or transcript enters the distribution.

The [published package](published/) carries byte-preserving Git attributes and
checksums. Its [repository-input receipt](published/repository-source-manifest.json)
distinguishes qualified working-input hashes from committed Git-input hashes:
Git normalizes some Windows text line endings, but no other input change is
accepted. Installed dependencies are identified separately, not claimed as
committed source. Books are GitHub repository downloads, not additions to the emulator's
Pages application payload. Public commit bytes and exact deployment qualification
are recorded for the original edition in workstream
[123](../../TODO/123_PROCEDURAL_3D_MODELING_HANDBOOK.todo), and for this cover revision
in [124](../../TODO/124_SUPPLIED_BOOK_COVERS.todo)
after remote verification; local rendering alone does not establish publication.

Not claimed: fresh-machine reproduction, byte-identical rebuilds, physical CAD
accuracy, measured real-world photometry, exhaustive browser/device coverage,
printer prepress certification, an independent rights audit or perfect transfer
of an agent's memory.
