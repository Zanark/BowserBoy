# BowserBOY contributor context

BowserBOY is a static browser GBA player with an interactive Three.js desk.
The runtime is EmulatorJS/mGBA; saves belong to the browser origin.
Only the original Pixel Lab demo is included in the website build.

## Source and verification

- `web/`: HTML documents and CSS; emitted at the website root.
- `src/`, `assets/`: application code and runtime artwork.
- `scripts/`, `tests/`: allowlisted build/server, tracking and verification.
- `docs/`: guides, showcase images, `book/` and `releases/`.
- `TODO/`: stable numbered workstreams, index and causal ledger.
- `.github/`: gated Pages/manual release workflows and tracking configuration.

From the repository root, use `npm run check`, `npm test`, `npm run build`
and the affected cases from `npm run test:browser`.
The website's public URLs are independent of source-file placement.

## Invariants and boundaries

Preserve full-resolution rendering, GBA saves/input/power behavior and the
existing exact-source release gate. Historical qualification is not a new
successful run. A local book or completed release workflow is not a published
GitHub Release.

Phone performance, DS emulation and boxed cartridges remain deferred in
workstreams 78-80. Creating their issues does not authorize implementation.
Supplied demo media permissions are not blanket rights for new ROMs or testing.

Keep all eight workstream fields, evidence distinct from human approval, and
issue backlinks consistent with the [tracking guide](../docs/GITHUB-TRACKING.md).
Never publish credentials, local continuity, raw conversations or social data.
Read current contracts and source before editing; preserve unrelated changes.
