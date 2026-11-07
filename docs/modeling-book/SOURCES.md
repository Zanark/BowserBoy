# Sources, model coverage and research limits

## Immutable implementation, later manuscript

The public implementation cutoff for this handbook is `1e4ef518d6943ab1af39cef3b4d558f209a17891` in `Zanark/BowserBoy`. Chapter source links use that revision. The assembler checks each cited file and line range against the actual committed blob and caches repeated reads. It does not treat a successful HTTP response, a search-result preview or a matching filename as source verification.

The source manifest records the exact manuscript, production, atlas and coverage inputs used for the edition. Those later-created files are not retroactively placed at the implementation cutoff. Relative references to new supplementary files under this book may point to the living `main` branch; those links are recorded separately and are not immutable implementation evidence.

The relevant public entry points are [the application dependency declaration](https://github.com/Zanark/BowserBoy/blob/1e4ef518d6943ab1af39cef3b4d558f209a17891/package.json), [the handheld factory and geometry helpers](https://github.com/Zanark/BowserBoy/blob/1e4ef518d6943ab1af39cef3b4d558f209a17891/src/handheld.js), [the DS factory](https://github.com/Zanark/BowserBoy/blob/1e4ef518d6943ab1af39cef3b4d558f209a17891/src/ds-handheld.js), [Pear Boy](https://github.com/Zanark/BowserBoy/blob/1e4ef518d6943ab1af39cef3b4d558f209a17891/src/pear-boy.js), [the axolotl](https://github.com/Zanark/BowserBoy/blob/1e4ef518d6943ab1af39cef3b4d558f209a17891/src/axolotl-lamp.js), [the lamp and lighting systems](https://github.com/Zanark/BowserBoy/blob/1e4ef518d6943ab1af39cef3b4d558f209a17891/src/lighting.js), and [scene integration](https://github.com/Zanark/BowserBoy/blob/1e4ef518d6943ab1af39cef3b4d558f209a17891/src/scene.js). The chapters provide narrower line-level evidence and supporting motion, input and regression references.

## Coverage is an explicit inventory

Part one covers the GBA's shell, seams, front/rear layers, recess, LCD, controls, grips, generated details, cartridges and texture/artwork boundaries. It explicitly distinguishes the curved LCD outline from a thick optical lens; no separate transmissive GBA glass slab exists at this cutoff. Its foundation chapters explain the library, reference and geometry contracts needed to reconstruct those objects.

Part two covers the DS lower deck, upper lid, hinge-related construction, hardware, controls, markings, separate planar displays, reflective powered-off glass material, stylus, touch domain, cartridge choreography, inspection and model regression evidence. Curved DS cover geometry is a labeled extension proposal, not an implemented model. The stylus and cartridge are not omitted merely because they are subordinate objects rather than independent top-level factories.

Part three covers Pear Boy's body and face, projection, expressions, gaze, freckles, limbs and rope, plus the axolotl's body, gills, tail and facial features. It then connects the companions to light emission, dragging, gravity, settling and complete clearance envelopes.

Part four covers the desk, room, tripod lamp and shared systems that make every model behave coherently: exposure, color, shadows, reflections, screen materials, picking, render lifecycle, algorithms, design principles, bounded recovery and causal history.

The four `coverage/part-*.json` files retain per-model source, symbol, component, chapter, test and limitation records. They also list actual source reads, consulted research and historical evidence. The assembler checks their structure and basic family coverage. That mechanical inventory is not a semantic proof that every code line or visual nuance has a correct explanation; the chapter review and explicit limitations remain necessary.

An empty mapped-test list explicitly means no mapped test, never a pass. Installed dependency metadata and this later manuscript are recorded separately from files that exist at the implementation cutoff.

## Libraries and asset provenance

The application models are constructed procedurally with Three.js; browser canvas code creates many textures and markings. Playwright is a browser-automation dependency, not the mesh-authoring library. The book pipeline separately uses Markdown-it, Mermaid, Paged.js, Playwright Core, PyMuPDF and Pillow. Do not merge those roles into a claim that a PDF tool built the handheld geometry.

Version declarations, lockfiles, installed-package identities and actual served resource hashes answer different questions. Chapter one explains the application toolchain; the edition manifest identifies production inputs; the atlas receipt records the actual browser and Three package used for the captures. A lockfile alone does not establish that an arbitrary installed directory is intact.

The factories use existing supplied brand artwork as well as generated labels. The atlas and cover are original diagnostic compositions of the project's actual procedural geometry, not photographs, historical design drawings or AI-generated replacements. The capture manifest describes lighting, pose, projection, source identity and limitations. The project's third-party notices remain part of the delivered edition.

No commercial ROM, firmware, private game recording or raw conversation is required to reconstruct the illustrated models. The atlas deliberately leaves factory displays in their non-gameplay state. Existing authorized application demonstrations, when referenced in the living documentation, have their own media provenance and do not become proof of every mechanism discussed here.

## External research is bounded

Each part's coverage receipt records consulted external references, consultation date, supported mechanism and scope. Chapter citations explain the specific use. Official library or browser documentation is used to clarify geometry, transforms, materials, rendering and platform behavior, not to invent an original modeling history.

Current documentation may have changed since the pinned implementation or may describe a different release. Verify version-specific behavior against the installed package and the relevant code before applying a recommendation. If a chapter proposes an alternative, it is not evidence that the alternative is already deployed.

Short explanatory code and equations are teaching tools unless explicitly identified as exact source. Preserve actual source attribution, and do not confuse a reduced worked example with a complete drop-in replacement for a factory.

## Verification and non-claims

The production manifest records actual chapter prose counts, diagrams, learning markers, illustration derivatives, implementation source hashes, atlas policy and preservation checks. The browser layout report and native PDF review identify actual pages, chapter ranges, text coverage, links, fonts and bounds. The checksum file identifies delivered bytes.

The edition's review note states the actual visual inspection performed for that exact PDF. Generated review images are candidates for inspection, not proof that inspection occurred. Mechanical success does not imply human acceptance, independent rights clearance, PDF/UA accessibility, printer prepress, a fresh-machine rebuild or byte-for-byte reproduction across browsers.

The modeling edition guards the earlier GBA PDF, NDS PDF and NDS offline reader without rebuilding them. Their preservation is not new validation of the old application or repair of previously parked browser cases. Any application CI accounting must name the actual revision and run and keep passed, skipped, failed and unrun counts separate.

This book aims to make modeling decisions reconstructable, but it is not a literal replica of an assistant and cannot guarantee complete transfer of undocumented knowledge. Improvements should add source-backed mechanisms, experiments and corrected limitations rather than confident filler. When evidence ends, the claim ends with it.
