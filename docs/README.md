# Documentation and repository map

[Play](https://zanark.github.io/BowserBoy/) |
[Visual showcase](../README.md) |
[Public releases](releases/README.md)

## Start here

| Need | Read |
|---|---|
| First public release and package identity | [v1.0.0 release notes](releases/v1.0.0/README.md) |
| Create a GitHub Release manually | [Release workflow guide](releases/README.md#manual-github-releases) |
| Current blockers and remaining work | [TODO index, Current pending work](../TODO/00_INDEX.todo) |
| Playing, controls and local development | [Player/developer guide](GUIDE.md) |
| Nintendo DS console, controls and save limits | [DS instructions](GUIDE.md#nintendo-ds) |
| Saves, recovery and portable backups | [Saving guide](SAVING.md) |
| Current implementation and boundaries | [Architecture](ARCHITECTURE.md) |
| Tests, actual deployment and public evidence | [Verification](VERIFICATION.md) |
| Capture editions, artwork and motion provenance | [Media](MEDIA.md) |
| NDS development journey and engineering, including shared infrastructure | [Two Screens, One Little Escape](nds-book/README.md), [PDF](nds-book/published/Two-Screens-One-Little-Escape.pdf), [offline reader](nds-book/published/Reading-Edition.html), [review](nds-book/REVIEW.md) |
| Preserved GBA engineering book | [Building a Little Escape](book/README.md), [PDF](book/published/Building-a-Little-Escape.pdf), [second edition/build](book/editions/2026-11/README.md), [historical review](book/editions/2026-11/REVIEW.md) |
| Complete procedural 3D construction and agent reconstruction | [From Shapes to a Living Desk](modeling-book/README.md), [328-page PDF](modeling-book/published/From-Shapes-to-a-Living-Desk.pdf), [offline reader](modeling-book/published/Reading-Edition.html), [review](modeling-book/REVIEW.md) |
| Workstreams and causal development history | [TODO index](../TODO/00_INDEX.todo), [ledger](../TODO/04_DEVELOPMENT_LEDGER.todo) |
| Dependencies and supplied artwork | [Third-party notices](../THIRD_PARTY_NOTICES.md) |

## Front-page contract

Keep the root README a GIF-first showcase: preserve useful interaction
animations, use short captions, and link to this documentation rather than
adding long explanations, control lists, test counts or development logs.
Detailed controls belong in the player guide; capture provenance and older
still references belong in [Media](MEDIA.md); technical deep dives belong
in the architecture guide or engineering book. This is the owner's explicit
policy for this repository.

## Folder responsibilities

| Path | Responsibility |
|---|---|
| `web/` | HTML entry documents and stylesheet; build/server retain root website URLs |
| `src/` | Application, native-runtime adapter, state/storage, controls and scene |
| `assets/` | Runtime artwork and sprites; paths preserved |
| `scripts/` | Allowlisted build/server/checks, original demo and media production |
| `tests/unit/`, `tests/browser/` | Correctness checks using original Pixel Lab (GBA) and Twin Lab (DS) |
| `docs/`, `docs/images/` | Current guides, evidence and captioned showcase media |
| `docs/book/` | Preserved first Markdown edition, second-edition additions and independent local production tooling |
| `docs/nds-book/` | Independent DS manuscript, source register and separately published PDF/offline reader; no GBA-specific chapters |
| `docs/modeling-book/` | Independent 38-chapter construction manual for all models, diagnostic atlas and separately published PDF/offline reader |
| `TODO/` | Stable numbered workstreams, index and development ledger |
| `docs/releases/` | Versioned public milestones, package manifests and checksums |
| `assets/demos/` | Separately authorized media/demo assets, not correctness fixtures or static build inputs |
| `.agent-context/README.md`, `.agent-context/PUBLIC.md` | Public-safe project handoff; private continuity remains ignored |
| `.github/` | Nineteen-way gated verification/Pages deployment and manual-only GitHub Releases |

Generated/local paths are not additional source editions: `dist/` is the
rebuildable static preview/deployment output; `node_modules/` is installed
tooling; `test-results/` and `playwright-report/` are disposable test output.
`docs/book/output/` and the book production candidate are ignored local render
artifacts, not Pages inputs or additional checked-in editions.
`docs/book/published/` holds the separately tracked reviewed PDF/checksum for README
readers and manual release attachment. This does not add the book to the static
application build or change the frozen first-release archive.
`docs/nds-book/published/` holds the independent DS PDF, scriptless offline reader
and edition receipts; `docs/nds-book/output/` and `.nds-candidate/` are ignored.
`docs/modeling-book/published/` holds the independent modeling edition;
its `output/` and production `.models-candidate/` are ignored local artifacts.
None of the books is part of the emulator's Pages application payload.
Release ZIPs are generated local artifacts. All are ignored by Git.
Old failure evidence is archived outside the repository before cleanup, not
silently treated as current evidence. Private context state, memory, journal,
references and social records are excluded from Git. No context files enter
the public website build.

The source organization changed on November 6, 2026; deployed website URLs,
runtime artwork and test paths stay unchanged. It does not merge historical
figures into a new capture edition or rewrite failed workstream attempts as
if they never happened. Historical path receipts refer to their dated layout.

## GitHub tracking

See [tracking and synchronization](GITHUB-TRACKING.md) for issue/Project mappings,
safe credentials, preview/apply commands and the public synchronization receipt.
