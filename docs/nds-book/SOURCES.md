# Source register and edition limits

## What is pinned

Implementation and historical citations point to public repository revision
`61845372142b41992916f3732ea102cc0f4c8edf`. This is the runtime cutoff,
not the later commit that publishes this book. The production source manifest
hashes the actual manuscript, selected illustrations and builder inputs.
It also records the pinned source files referenced by chapters.

The book synthesizes source-backed behavior and a selected causal history.
It is not a complete export of every workstream, issue, transcript or
development record. No private conversation or context store is a source.
Unfinished historical states remain unfinished in the original records;
later public qualification is described separately.

## Implementation map

| Chapters | Source and symbols | What the source supports |
|---|---|---|
| 03, 04, 07, 10 | [ds-controller.js](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/src/ds-controller.js): `load`, `launch`, `message`, `command`, `save`, `suspend`, `togglePower` | DS lifecycle, session correlation, early loading handoff, power semantics and explicit errors |
| 03, 05, 06, 07 | [player.js](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/src/player.js): `initialize`, `capture`, `restore`, `input`, `dsInputFrame`, `dispatchTouch` | Pinned native adapter, retained framebuffer, source-owned input and native touch scheduling |
| 04-07, 09 | [ds-cartridge.js](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/src/ds-cartridge.js): `DS_OPTIONS`, `identifyDsRom`, `dsScreenRegions`, `dsTouchFromUv`, backup encoder/decoder | Accepted cartridge/header ranges, display geometry, coordinate conversion and portable envelope |
| 06, 09, 10 | [ds-touch.js](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/src/ds-touch.js): `DsTouchQueue` | Contact-edge preservation, adjacent-move coalescing, cancellation generation and error delivery |
| 07, 09, 10 | [ds-store.js](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/src/ds-store.js): `DsSaveStore` | Separate database, runtime/ROM identity, bounded open and transaction-complete acknowledgement |
| 06 | [preferences.js](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/src/preferences.js): `CONTROLS`, with DS overrides | Actual DS key mapping, not legacy canned status wording |
| 02, 08 | [ds-handheld.js](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/src/ds-handheld.js) | Physical lid/base, control anchors, markings, slots and stylus geometry |
| 08 | [scene.js](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/src/scene.js), [desk-clearance.js](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/src/desk-clearance.js) | Playing/inspection pose, actual lamp targeting and mode-specific spatial clearance |

These are explanations of the inspected application at the cutoff. They
do not independently certify DeSmuME internals or future runtime versions.

## Historical and evidence map

| Chapters | Public record | Role and limits |
|---|---|---|
| 01-02 | [79 - DS implementation](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/TODO/79_NINTENDO_DS_EMULATION.todo), subsequent DS workstreams and ledger | Causal development evidence, including locally verified stages and open owner/device review |
| 01, 11 | [114 - supported-console status](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/TODO/114_DS_CONSOLE_STATUS.todo) | Later product designation; not universal title or device qualification |
| 02, 04, 08 | [115 - immediate loading](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/TODO/115_DS_IMMEDIATE_LOADING.todo), [116 - upright lighting](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/TODO/116_DS_UPRIGHT_LIGHTING.todo) | Specific user-facing problems, bounded changes and dated local evidence |
| 11, 13 | [105 - parked browser cases](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/TODO/105_PARKED_BROWSER_CASES.todo) | Explicit unresolved coverage, not repaired cases |
| 11 | [Verification](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/docs/VERIFICATION.md), exact linked workflow runs | Identified local/hosted/public observations, not a fresh rerun during book authoring |
| 06, 11, 13 | [DS browser tests](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/tests/browser/ds.spec.mjs), [touch unit tests](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/tests/unit/ds-touch.test.mjs) | Original Twin Lab correctness contracts and explicit skip boundaries |
| 12 | [120 - untouched opening media](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/TODO/120_UNTOUCHED_INTRO_README_MEDIA.todo), [Media](https://github.com/Zanark/BowserBoy/blob/61845372142b41992916f3732ea102cc0f4c8edf/docs/MEDIA.md), capture/replay scripts | Current showcase provenance; recorded LCD replay is not live input evidence |

## Included illustrations

The cover reuses supplied `assets/ds-logo.png` without regeneration. Four
chapter figures select existing `ds-inspect.gif`, `ds-lighting.gif`,
`ds-gameplay.gif` and `axolotl-movement.gif`. Print and offline HTML embed
metadata-clean frame-zero PNG derivatives. This makes the reader independent
of animation playback and the network; it also means a still cannot establish
motion, a complete lighting comparison or an actual gameplay response.

The animated source remains available in the repository. Game output is
historical showcase footage with recorded native LCD replay. No ROM, raw
video or private filesystem path is embedded. The project notices remain
the artwork/dependency provenance reference. This edition does not assert
new ownership of supplied logos, game imagery or Nintendo marks.

## Reproducibility and review boundary

The repository's locked local book dependencies render Mermaid and paginate
with Chromium and Paged.js. PyMuPDF checks the real PDF. Installed system
fonts and browser versions can affect pagination and bytes; a fresh-machine
or byte-identical rebuild is not claimed.

Native text coverage, page geometry, link destinations, bookmarks and
embedded fonts are mechanical checks. Contact sheets and selected larger
native pages are a separate bounded visual review. Neither is user approval,
PDF/UA conformance, printer prepress, a rights audit or new device testing.
The production/review record names the exact delivered edition and limits.
