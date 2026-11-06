# A maintainer's field guide

## Start with the failed promise

Use this reference after the teaching chapters. It is not a replacement for
the player's task guide or for reading the relevant implementation.

| Symptom | First boundary to inspect | Tempting but misleading shortcut |
|---|---|---|
| A renamed file seems to lose progress | Compare complete ROM digest, browser origin/profile and storage result | Match by filename or title |
| A power cycle loads an unexpected instant | Distinguish battery boot from checkpoint restore | Always load the newest checkpoint |
| A save appears successful but vanishes | Observe transaction completion/abort and actual error reporting | Treat `put` success as durable commit |
| A button stays down after a view change | Inspect held source sets, held-key mapping and release-on-blur paths | Clear a visual cap flag only |
| A stale response completes a new command | Check window, origin, session and request identity together | Compare only message type |
| Fullscreen appears different | Follow the shared retained native canvas and aspect ratio | Start another core for the new view |
| Scene is sharp but movement stalls | Separate native time, callback state and room-paint cadence | Reduce pixel ratio without consent |
| Cartridge almost seats but gate fails | Record committed motion steps and completion predicate | Decide completion by visual impression |
| Shade looks like a luminous cylinder | Inspect emissive map as well as reflected map | Add brown noise to the fabric |
| A dark-room indicator looks white | Inspect exposure and tone-mapped pixels | Assert that the source hex string is green |
| Audio has reserve but stutters | Separate allocation, live scheduled reserve and actual clock behavior | Add volume or repeatedly increase capacity |
| A release request is blocked | Resolve exact source, latest exact-source Pages result and tag identity | Borrow an earlier green commit's result |
| README still shows old geometry | Check actual media bytes, capture origin and served GitHub images | Change only the URL's version query |

## A small, honest investigation loop

1. Name the user-visible requirement and the exact source/environment.
2. Read its owner and directly affected state transitions.
3. Reproduce with the smallest meaningful fixture and retained bounds.
4. Record the observed failure before forming a cause.
5. Change the responsible mechanism, then rerun the affected check.
6. Reconcile documentation and delivery criteria without erasing history.

For timing failures, distinguish an observation from a hypothesis.
"Expected seated, observed inserting after fifteen seconds" is an observation.
"GPU contention caused it" requires additional evidence. A plausible mechanism
from source is a reason to measure, not a completed diagnosis.

## Documentation has several update rules

The README remains the visual invitation; its owner requested a minimal
front page, so this edition is linked from the book/documentation hubs rather
than expanded into a long front-page manual. The guide teaches actions.
Architecture describes current boundaries. Verification identifies executed
evidence. Media identifies actual captures. The numbered TODO and ledger
preserve scope and reasons.

This rendered edition is frozen to its manifest. For a correction, keep
chapter IDs, change canonical Markdown deliberately and rebuild the candidate.
Check the source diff and all affected artifacts. A typography change can
alter page numbers even when prose remains the same. A content change can
invalidate companion page references. Never relabel an old companion as bound
to a new PDF solely because the title matches.

The first Markdown edition has no page map. This edition's chapter-page table
is therefore the first rendered map, not an invented old-to-new pagination
concordance. Stable chapter IDs bridge the two presentations.

## Local production and rights

The edition's source catalogue is explicit. Paths are confined to the repository
and symlinks are rejected by the source resolver. Diagrams render locally;
the browser denies external resource requests. That policy is a production
boundary, not an operating-system sandbox.

The reader contains no scripts. Its internal links, rendered SVGs and image
bytes must work in an offline standalone copy. The native PDF receives a
concise outline and is checked for page geometry, searchable chapter text,
learning markers and valid internal destinations. Browser layout and native
page checks complement one another.

Selected native-page raster review covers composition and readability at
identified samples; contact sheets do not prove every sentence was read.
Neither mechanism establishes PDF/UA, printer prepress, independent media
rights or human acceptance. Those remain separate questions for any proposed
external release.

Editable cover artwork and production sources remain in the repository.
Generated output, installed packages and private review images are not new
canonical manuscript. Preserve notices for supplied artwork and dependency
licenses, and do not package the whole workspace.
