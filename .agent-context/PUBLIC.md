# BowserBOY contributor context

BowserBOY is a static browser emulator with separate GBA and DS consoles on
an interactive Three.js desk. EmulatorJS runs mGBA and DeSmuME in independent
iframes; saves belong to separate browser-origin databases. Only the original
Pixel Lab (GBA) and Twin Lab (DS) demos are included in the website build.

## Source and verification

Current November7 follow-up: workstreams89-91 add a pickable camera-facing DS
pen, bottom-left one-line hints, independent framebuffer-driven LCD spill and
an original sine-partial DS power-on chime. Empty-slot power is powered-idle,
mute remains editable before boot, and audio permission errors are visible.
Shared menu routing gives DS Escape to its controller after shared move/popover
handling. Physical touch coordinates and existing GBA tune remain unchanged.
Syntax,35units,build and the final five-case Edge feature gate pass1.6m.
Native pen/cleanup/upside-down390x844DPR2, independent screen colors/black/off/
hinge/rendered cap spill,1440/390/320pxhints and both startup sounds are checked.
Actual pen/light captures reviewed; listening/device acceptance remains open.
The preceding eight-case run separately passes native lifecycle/precision/
hinge but has three documented failures; it is not an all-eight green claim.
Owner now explicitly authorizes commit/push and monitored gated deployment.
Older no-push/local-only statements below are historical, not current authority.
Existing Pages includes new tests automatically and requires all19browser
shards plus build; a public deployment requires an actual successful run.

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

The owner subsequently authorized a local DS prototype in workstream79.
Actual dual-screen/input/save/lifecycle tests and a390px viewport pass;
physical-phone performance, commercial compatibility and owner approval remain
unqualified. The later reference remodel originally uses teal #2A9D98/.80/.35,
a110-degree hinge, blue D-pad, lime controls, clipped stylus and rear-only emblem.
Live inspection repaint, table/pickup clearance, static GBA settings branding
and console-themed dock have a focused9-case browser gate. Existing desk
lighting/background and full resolution are retained.
This prototype is not pushed/deployed. Phone-performance work78
and boxed cartridges80 remain deferred.
Local workstream84 adds pear-boy: independent warm lighting/dock controls,
longer thick rope limbs, cursor/scared face and bounded3Dpickup/drop physics.
Whole-face tracking includes eyes, mouth and freckles. Default front-right
edge placement dangles the feet; farther-back placements rest them on top.
All six pear plus four DS browser cases pass together after an unobstructed
held-DS placement adjustment. The exact feature snapshot also passes all
13affected browser cases together, including three original lighting cases,
and30units without unrelated pending clock/tracking edits.
The latest supplied Chrome Neon DS emblem has its black matte removed.
Body collisions remain upright/box-based; ropes collide with the pear/desk,
not arbitrary prop surfaces or moving supports. Owner/device review pending.
Supplied demo media permissions are not blanket rights for new ROMs or testing.

Workstream85 adds independent GBA/DS desk movement without angular changes:
drag/touch, wheel depth, keyboard, drop, cancellation and reset. Click still
plays; normal Inspect rotation is separate. Put down restores each moved
session position exactly. No persistence across reloads or dynamic prop pushing.
35units,syntax/build pass. The26-case affected Edge gate has25passes and one
obsolete phone-dock height failure; the corrected dock case passes separately,
retaining44px targets, physical-power clearance and320px move reachability.
All4console/all4DS/all6pear cases pass with nativeGBA/sparse/Inspect regressions.
Actual moved captures are reviewed. Owner/device review and publication remain
separate; historical book/media are not regenerated.

Keep all eight workstream fields, evidence distinct from human approval, and
issue backlinks consistent with the [tracking guide](../docs/GITHUB-TRACKING.md).
Never publish credentials, local continuity, raw conversations or social data.
Read current contracts and source before editing; preserve unrelated changes.

Workstream87 adds DS body/hinge inspection,30-180-degree articulation,
session-only locked gameplay angles, flat camera-facing unlocked gameplay
and a functioning front-left44px physical power target. Saved desk pose and
110-degree resting hinge are independent. Hinge edits invalidate renders;
folded lids block caps/stylus. Actual native145-degree input/save/power,
30-degree occlusion,390px resizing and both consoles' desk restoration pass.
Final35units,syntax/build and12affected Edge cases pass2.4m. Reference-pose
paint thresholds remain unchanged; metallic brightness varies with angle.
An unrelated GBA lamp-off darkness failure reproduces on committed HEAD.
Final locked-pinch correction keeps two-finger zoom without rotating;
expanded pose case passes24.5s, and syntax/35units/build pass again.
Owner/device review remains pending; no push/deployment or frozen-book change.

Workstream86 supersedes the green-looking teal: #0077FF blue-cyan lid and
separate #40A0FF slightly lighter NDS base, paint reflection20. Both retain
.80/.35 grain/clearcoat; GBA/global lighting/exposure/geometry stay unchanged.
35units,syntax/build pass. Final lighter paint passes four DS cases; the
repaired shell-comparison fixture passes separately with actual warm/Room
pixel checks and >15% same-lighting base improvement. Actual captures reviewed.
Owner approval and publication remain separate.

Workstream88/issue86 (OPEN, Project1/In progress) corrects Twin Lab stylus
Y scaling and drawing bounds, not
physical UVs. DS-only EJS_noAutoFocus prevents hidden-runtime focus from
immediately releasing a drag; real host blur still releases. Inclusive
browser viewport sampling keeps the last native row/column on screen.
35units,syntax/build and both affected native Edge cases pass together1.6m.
Twelve fresh native/physical targets cover four body/hinge locks, upside-down,
exact corners, held mouse/touch drags,50/65%zoom and390x844DPR2 resizing.
Native brush64px/origins stay within one pixel of pointer quantization;
physical corner probes allow the3x3antialias footprint. Companion native
case retains buttons, folded-lid rejection, saves/power/reload and GBA isolation.
Changed original-demo ROM bytes isolate old demo checkpoints by content hash.
Actual rolled/phone captures reviewed. Owner/device review remains pending;
no full-suite, commercial-game or deployment claim. Frozen book unchanged.
