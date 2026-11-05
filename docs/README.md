# Documentation and repository map

[Play](https://zanark.github.io/BowserBoyAdvance/) |
[Visual showcase](../README.md) |
[Public releases](../releases/README.md)

## Start here

| Need | Read |
|---|---|
| First public release and package identity | [v1.0.0 release notes](../releases/v1.0.0/README.md) |
| Playing, controls and local development | [Player/developer guide](GUIDE.md) |
| Saves, recovery and portable backups | [Saving guide](SAVING.md) |
| Current implementation and boundaries | [Architecture](ARCHITECTURE.md) |
| Tests, actual deployment and public evidence | [Verification](VERIFICATION.md) |
| Capture editions, artwork and motion provenance | [Media](MEDIA.md) |
| Chaptered technical explanation | [Engineering book](../book/README.md) |
| Workstreams and causal development history | [TODO index](../TODO/00_INDEX.todo), [ledger](../TODO/04_DEVELOPMENT_LEDGER.todo) |
| Dependencies and supplied artwork | [Third-party notices](../THIRD_PARTY_NOTICES.md) |

## Folder responsibilities

| Path | Responsibility |
|---|---|
| `index.html`, `player.html`, `styles.css` | Static entry points and presentation; retained at root |
| `src/` | Application, native-runtime adapter, state/storage, controls and scene |
| `assets/` | Runtime artwork and sprites; paths preserved |
| `scripts/` | Allowlisted build/server/checks, original demo and media production |
| `tests/unit/`, `tests/browser/` | Correctness checks using original Pixel Lab |
| `docs/`, `docs/images/` | Current guides, evidence and captioned showcase media |
| `book/` | Chaptered book with its own first-edition source identity |
| `TODO/` | Stable numbered workstreams, index and development ledger |
| `releases/` | Versioned public milestones, package manifests and checksums |
| `demos/` | Separately authorized media/demo assets, not correctness fixtures or static build inputs |
| `.github/` | Ten-way gated verification and Pages deployment |

Generated/local paths are not additional source editions: `dist/` is the
rebuildable static preview/deployment output; `node_modules/` is installed
tooling; `test-results/` and `playwright-report/` are disposable test output.
Release ZIPs are generated local artifacts. All are ignored by Git.
Old failure evidence is archived outside the repository before cleanup, not
silently treated as current evidence. Private `.agent-context/` is excluded
from both Git and public builds.

This organization intentionally preserves working source, artwork and test
paths. It does not merge historical figures into a new capture edition or
rewrite failed workstream attempts as if they never happened.
