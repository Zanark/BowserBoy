# Source and claim register

## Read source links as bounded evidence

The first ten adopted chapters retain their original
[source register](../../SOURCES.md). That register identifies the original
`ab912d5` implementation and later dated deltas. It is not a claim that every
sentence was re-executed on today's browser.

The new engineering chapters explain source at base revision
`9ff921be5d1b1d4a6657a181fc3ac84ea72373e7`; relevant application and workflow
files were unchanged by this book task. Documentation already contained
uncommitted audit corrections. The source manifest hashes the exact selected
files, so that distinction is not hidden behind a commit label.

| Claim ID | Supported statement | Evidence and scope |
|---|---|---|
| C01 | Static host delivers the shell; browser executes the selected native core | `src/app.js`, `src/player.js`, `scripts/site-files.mjs`; first-edition S01/S02/S10 |
| C02 | Save identity is content-based, with separate checkpoints and battery mode | `src/cartridge.js`, `src/save-store.js`; first-edition S03/S04 |
| C03 | Same-origin frame replacement isolates lifecycle, not hostile origin privileges | `src/app.js`, `src/player.js`; Chapters 01/02/08 |
| C04 | Held actions aggregate source ownership and release using the originally pressed action | `src/player.js`, `src/keyboard.js`; first-edition S02/S08 |
| C05 | Native post-shader picture supplies the LCD, fullscreen and reduced light sample | `src/player.js`, `src/scene.js`, `src/lighting.js`; first-edition S02/S06/S07 |
| C06 | Current scene retains capped device pixel ratio while scheduling room draws | `src/scene.js`, especially construction and `render`; Chapter 11 |
| C07 | Insertion has paint-eligible capped steps and a completion predicate | `src/scene.js:render`; explanation only, not a newly measured hosted diagnosis |
| C08 | Woven detail modulates reflected and emitted shade terms | `src/lighting.js:createDeskLamp`; Chapter 12 |
| C09 | Indicator emission compensates current exposure during dark adaptation | `src/scene.js:render`; final-pixel correctness requires rendered evidence |
| C10 | Manual release requires the latest successful existing Pages run for exact source | `.github/workflows/release.yml`; Chapter 13 |
| C11 | Release packaging and write-scoped publication are separate jobs | `.github/workflows/release.yml`; implemented procedure, not a completed publication |
| E01 | Qualified visual `1b0385b` has recorded public byte/behavior evidence | `docs/VERIFICATION.md`, `docs/MEDIA.md`; historical release receipt |
| E02 | Latest `9ff921b` Pages run fails reload seating and does not deploy | `docs/VERIFICATION.md`; dated audit cutoff, not a fresh status poll during book production |
| E03 | First manual release attempt blocks before unqualified packaging | `releases/README.md`, `docs/VERIFICATION.md`; no GitHub Release claimed |
| E04 | Final showcase media is from the November 6 local capture edition | `docs/MEDIA.md`; capture origin remains local despite later public application qualification |
| T01 | Numeric worked examples and capstone are synthetic learning material | Explicit assumptions in the corresponding W/R/Q/A items; not benchmarks or implemented features |

## Exact public implementation references

- [Scene at the current base](https://github.com/Zanark/BowserBoyAdvance/blob/9ff921be5d1b1d4a6657a181fc3ac84ea72373e7/src/scene.js)
- [Lighting at the current base](https://github.com/Zanark/BowserBoyAdvance/blob/9ff921be5d1b1d4a6657a181fc3ac84ea72373e7/src/lighting.js)
- [Manual release workflow at the current base](https://github.com/Zanark/BowserBoyAdvance/blob/9ff921be5d1b1d4a6657a181fc3ac84ea72373e7/.github/workflows/release.yml)
- [Qualified visual application](https://github.com/Zanark/BowserBoyAdvance/commit/1b0385b384a1329fe643607c4874af88e5259001)
- [Project dependency and artwork notices](../../../THIRD_PARTY_NOTICES.md)

Documentation links outside the compiled book open the repository's current
public files. Those links are references, not embedded snapshots; the local
manifest identifies reviewed input bytes. Upstream product guarantees require
their own authoritative documentation, not inference from this application.

## Selected images and excluded material

The manufactured-control image is a historical geometry figure. It is not a
new lamp capture. The current tabletop still shows the final warm woven lamp.
The startup GIF is represented by a labeled print still; animation itself is
not proven by that still. Original supplied logos remain governed by the
project notices. No new claim of independent artwork rights is made.

Excluded inputs include private continuity, raw MeshBoard conversation bodies,
session logs, private recordings, dependency caches, commercial games,
firmware and unrelated projects. The bookmaking thread supplied process
guidance; it is not republished here. The other book's manuscript and cover
were not imported.

The original cover vector, teaching additions and synthetic calculations were
authored for this local edition. No publisher branding or affiliation is used.
This register is a source-selection receipt, not legal clearance to publish
the exact finished artifact.
