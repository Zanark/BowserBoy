# The standalone agent handoff

This appendix is an execution contract for an agent that did not participate in BowserBOY's original development. Read it with the relevant model chapters and the source register. It is designed to preserve reasoning boundaries and reproducible techniques, not to impersonate an earlier assistant or assert access to its hidden reasoning.

## Establish authority and the baseline

Begin by stating the requested visible outcome in ordinary language. Examples include making a facial feature travel farther without entering the body, making a hinged lid preserve its relationship to the lower deck, or making a moved lamp illuminate the scene from its new position. Keep the outcome separate from a proposed implementation. A user asking for greater movement has not necessarily asked for a new geometry representation.

Record the repository revision, worktree state and relevant model factory. Preserve unrelated edits, supplied artwork and previously published editions. The implementation documented here is pinned to `1e4ef518d6943ab1af39cef3b4d558f209a17891`; a later working tree is a new baseline, not a reason to silently reinterpret the book. Before using a chapter's numeric value, check whether the active code still agrees.

Define allowed writes and output boundaries. A diagnostic capture does not authorize editing the application model to make the capture easier. A book request does not authorize publishing private ROMs, raw recordings or conversation history. A local verification does not imply permission to push or deploy. Follow the actual user's authority for those operations.

Inspect the existing numbered workstreams and contributor instructions. For this project's established workflow, retain the TODO index, numbered workstream, development ledger and all required status, purpose, task, acceptance, evidence and completion fields. Keep technical completion separate from aesthetic approval. Where remote tracking is authorized, verify the real issue and Project status rather than merely writing an issue URL into a local file.

## Construct a model contract

Write a compact contract before changing geometry. It should identify the root group, local axes, scale convention, primary silhouette, geometry helpers, material roles, texture sources, movable subgroups, returned handles and disposal owner. Add the important interaction surfaces and collision envelopes. If any of those are unknown, make them a question to resolve in source or a small experiment; do not fill them with a plausible guess.

For a console, include the front/back convention, shell layers, seam, bezel opening, active display, inactive glass, buttons, grips, ports, labels and cartridge relation. For the DS, add the lower-deck origin, upper-lid pivot, hinge geometry, separate screens, stylus and touch coordinates. For a companion, include body shape, face projection, expression groups, limbs, light contribution, drag/rest states and full bounds.

Separate appearance from mechanism. An object can look rounded because of an actual bevel, a smooth normal field or a material response. Those are different constructions with different costs. A character can look soft because of the silhouette, curvature and diffuse material without a deformable physical simulation. A screen can look bright because it is unlit, emissive or externally illuminated; those mechanisms affect color and exposure differently.

Name dimensions by what they control. A parameter in radians is not a distance in model units. A local offset is not a world-space displacement after parent rotation. A physical lamp dimension in meters is not necessarily the scene unit used by the console. Carry units through the worked calculations and into diagnostic output.

## Rebuild the hierarchy in a small scene

Instantiate the original factory in an isolated scene before reconstructing it manually. Load required image resources first. In particular, await `loadBrand()` before calling the GBA factory, because its canvas textures draw the shared brand image during construction. Do not treat an import as resource readiness.

Capture a front, rear and three-quarter view with a declared projection. Compute bounds from the complete hierarchy after updating world matrices. Fit the camera to all corners rather than a guessed center and radius that can crop a protruding limb or stylus. Make any pose override explicit. In this edition's atlas, the DS returned lid group receives a fifteen-degree local-X rotation; this is a diagnostic pose, not a public `setHinge` method or a claim about the application's play angle.

Use neutral lighting to understand base surfaces, then test the real application lighting separately. When disabling material emission or model lights, record that policy in the capture receipt and caption. Do not present a studio render as proof that the table lamp produces the same result in the application.

Inspect large masses before details. Compare silhouette width, height, recess placement and front/back thickness. Then inspect seams, bevels, controls and small markings. Rebuilding detail before establishing scale tends to produce local perfection attached to the wrong global proportions.

If a primitive is transformed, inspect its local axes before applying the parent transform. A cylinder's construction axis, an extruded shape's depth and a plane's normal can differ. The relevant chapter explains each usage; do not assume one helper's orientation is a repository-wide convention.

## Preserve the visible surface

For layered hard-surface models, draw a cross-section on paper or in a small diagram. Identify which surface forms the recess floor, which forms the surrounding rim, which is an active display and which is glass. Check that the layers do not intersect, produce z-fighting or overwrite one another's intended color.

For facial patches on a curved body, apply the intended expression shape before projecting onto the shell. Translating already projected geometry can bury one end of the feature or detach it from the surface. The correct operation depends on the body's actual surface parameterization and the intended transform owner.

Test every movement extreme with every supported expression, not only a centered smile. Check the visibility of the foremost geometry from the real camera. A local `visible` property or a finite vertex coordinate does not establish that the eye or freckle is outside the body and visible to the user. Ancestor visibility and intervening geometry also matter.

Preserve the complete feature set when changing the gaze range. Tiny freckles and facial accents are easy to omit from an expression-only test while still being visibly wrong. Compare the projected screen-space displacement to the user's intended viewer-left, viewer-right, up or down direction; a world-axis sign alone does not establish that result after rotation.

Do not hide a surface problem with brighter emission or a different camera. Isolate geometry, normal orientation, material settings and illumination as separate variables. Restore the actual scene conditions before accepting the change.

## Treat materials as separate contracts

Record which surfaces use lit physical/standard materials and which deliberately do not. Preserve the active LCD's color path separately from inactive reflective glass and the surrounding plastic. Nearest sampling and mipmap choices belong to the display contract, not to every texture on the model.

Color values, output color space, tone mapping and exposure have to agree. A material that is pleasant in a studio can become unreadably dark or white in the application. A companion's emissive surface can overwhelm its facial detail even when its point light is correctly positioned. Raising global exposure can fix one object while breaking every other object.

When tuning, hold most variables fixed. Start with the visible body and screen under the real camera, then isolate the lamp, companion emitters and ambient contribution. Compare the same pose before and after the change. Record what the experiment actually excludes; turning off one companion is not the same as turning off both.

Small labels need an explicit resolution and filtering policy. Check the canvas crop, alpha processing, physical size and distance to the camera. A high-resolution texture is not automatically readable if the mark is physically too small, tilted, occluded or washed out. Respect supplied artwork and distinguish it from newly generated labels.

## Integrate movement without losing ownership

Separate authoring pose, interaction pose and settled desk pose. A factory's initial coordinates do not automatically become the safe home position after the scene places several objects together. A focus or inspection mode may temporarily move a console without authorizing the overwrite of its saved table pose.

Use the actual animation timestamp appropriate to the mechanism. A stale render timestamp, an arbitrary number of updates and a wall-clock delay can disagree with painted motion. For a fall or cartridge sequence, inspect the intermediate visible pose, not only the final state variable.

After changing shape or pose, re-evaluate the complete component envelope. A limb can extend beyond the body's current axis-aligned box; a rotated object can sweep through a larger envelope than its final orientation. Collision-free contact at one angle does not establish clearance throughout manipulation.

When choosing a home position, inspect deterministic ordering and tie behavior. An algorithm can be correct for one object order and fail when equally ranked objects are considered in the other order. Preserve existing tolerances and cache invalidation semantics unless the requirement specifically changes them.

Do not equate smooth animation with a physics simulation. The project includes explicit motion and settling mechanisms; explain the actual equations and state transitions used. If introducing a real physics engine, that is a substantial new dependency and behavior change requiring its own requirements, tests and resource budget.

## Preserve input ownership

Find the complete path from pointer location to selected geometry and from that geometry to the interaction owner. Occlusion, invisible ancestors, controls, stylus, lamp clicks, console dragging and inspection can compete. A model change can affect picking even when it does not change the visual design.

Test representative rays through the new shape and through neighboring controls. A broad invisible hit target may improve one interaction while stealing another. A decorative mesh may need to be ignored for a particular action without becoming globally invisible. Keep the existing ownership rules explicit.

For DS touch, preserve the relationship among the screen geometry, its world transform and touch coordinates. A visual change to a curved screen or frame should not silently change the emulated touch domain. Inspect real coordinate conversion and the active surface, not an unrelated screenshot rectangle.

## Use a layered validation plan

Start with the smallest deterministic checks that can reject the intended bug. For geometry, inspect component presence, dimensions, local relationships and finite values. For surface visibility, use actual foremost-hit or rendered evidence at the movement extremes. For interaction, exercise the correct pointer owner. For motion, inspect the painted intermediate and settled poses.

Add focused coverage only for the behavior introduced or fixed. Avoid tests that merely repeat constants or assert implementation spelling. Prefer a case that would fail on the old behavior and succeeds on the new visible outcome. Keep assertions meaningful when diagnosing environmental instability.

Use the established bounded-recovery rule for application tests: one justified repair attempt, then explicitly park a repeatedly failing case with its assertions retained and coverage debt recorded. Do not add retries until a flaky test happens to pass, weaken an unrelated requirement or report a skip as a fixed behavior.

Broaden validation when shared construction helpers, transform ownership, render scheduling or input routing are affected. A small visual patch can have a wide dependency boundary. Conversely, do not rerun an unrelated full suite repeatedly after the relevant checks have passed and nothing has changed.

Record the exact revision and environment of a hosted run. A local browser result is not a hosted deployment result; a successful build is not gameplay verification; a screenshot is not an input test. Count declared, passed, skipped, failed and unrun cases separately, and inspect all required shards and the actual deployment job.

## Reproduce the diagnostic atlas

Run the existing generator from the repository root in an environment with the locked application and production dependencies and an installed supported Chromium browser:

```powershell
node docs\modeling-book\tools\capture-model-atlas.mjs
python docs\modeling-book\tools\make-atlas-plates.py --review $env:BOOK_REVIEW_DIR
```

Set `BOOK_REVIEW_DIR` to an explicitly chosen private review directory before the second command. It is an output location, not a source of model images. A missing value must be corrected, not replaced by a success-shaped empty image report.

The capture generator verifies the pinned first-party sources, records raw and committed hashes, blocks external requests and writes eighteen PNGs plus its manifest. The plate tool composes those captures into an original six-model cover and a contact sheet. It does not redraw geometry or synthesize a replacement model image.

Read the receipt and inspect the actual contact sheet. Check for cropped limbs, missing controls, wrong front/back labeling, invisible faces and incorrect lid pose. The expected mesh count establishes inventory continuity, not visual correctness by itself. A future intended geometry change requires a new source cutoff and an explicitly new atlas, not editing an old receipt.

## Rebuild this book without touching the old editions

The modeling edition uses its own assembler and route:

```powershell
node --test docs\book\production\production.test.mjs
python -B -m unittest discover -s docs\book\production -p native_rules_test.py
node docs\book\production\build-models.mjs
node docs\book\production\render.mjs --models
```

The default route belongs to the GBA book; `--nds` belongs to the NDS-only book. Do not use either to update this handbook. The three routes have separate candidate and output directories. Existing qualified PDFs and the NDS reader are preserved by exact hash checks.

The modeling assembler verifies source spans against cached immutable Git blobs, checks the four model-coverage receipts, enforces substantive per-chapter and total prose floors, and embeds approved metadata-clean illustrations. It rejects a repeated long paragraph rather than counting a copied passage as new substance. Code blocks, image markup and URLs do not satisfy the prose requirement.

The renderer lays out the actual manuscript, renders Mermaid diagrams and computes chapter page ranges. Both browser and native checks require at least two hundred real pages and two hundred unique chapter-content pages. Cover, contents, part/chapter openers and reference appendices do not supply those chapter-content pages. Typography is inherited from the readable shared print style; padding and oversized type are not a depth strategy.

The native reviewer checks searchable content coverage, chapter markers, A4 bounds, links, bookmarks, embedded fonts and private-path leakage. Its privacy expression distinguishes a real Windows drive from an ordinary HTTPS URL. The offline reader is tested without scripts or external requests. Those are specific mechanical qualifications, not proof that all wording is correct or every page has been visually reviewed.

Inspect the generated contact sheets and selected native pages. Record the exact inspected scope and PDF hash in the edition review. A rebuild invalidates an earlier visual-review note. Do not describe a thumbnail-level review as full-resolution inspection of every diagram.

## Package and publish only what was authorized

Keep published byte-preservation attributes with the artifact checksums. On Windows, automatic line-ending conversion can change generated HTML or JSON between a qualified working file and its staged Git object. Verify the staged object bytes, not only the working tree, before declaring that the sealed edition will be delivered unchanged.

Stage an explicit allowlist. Exclude private inputs, raw captures not intended for publication, transient candidates, local review sheets, unrelated artwork and context stores. Keep the front README short and GIF-first; its role is to point to this book, not to absorb the book's construction explanations.

After an authorized push, verify the exact remote revision and actual downloaded artifact bytes. Monitor the exact deployment associated with that revision, including required browser shards, build and deployment jobs. A previous successful run cannot qualify a later commit.

Create or update only the owned MeshBoard persona when publishing the requested local reference thread. Use a professional-English question root, register the open thread, and add substantive replies with correct ownership and reply references. Verify the generated index and both thread views. A local board post is not an external social-network publication and does not wake another agent.

## Leave a better handoff

End with the visible outcome, the meaningful mechanism changed, the exact source/artifact identity and any real limitation. Update public development evidence and private continuity for their separate audiences. Preserve prior history instead of rewriting a failed experiment into an uninterrupted success story.

For a future extension, leave a small reconstruction recipe: required inputs, coordinate assumptions, geometry sequence, material roles, hierarchy, interaction owner, relevant views, regression checks and disposal policy. If the technique came from researched guidance rather than the implementation, label it. If a statement remains unverified, say so plainly.

The new agent's advantage should be better evidence and a clearer method, not borrowed confidence. That is how this handbook can improve over time without pretending that one document contains every possible modeling decision.
