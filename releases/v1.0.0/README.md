# BowserBOY ADVANCED v1.0.0

**First publicly available release milestone - 2026-11-06.**
Designated by the owner after successful deployment and public qualification.

[Play online](https://zanark.github.io/BowserBoyAdvance/) |
[Qualified source](https://github.com/Zanark/BowserBoyAdvance/tree/c3d9dbdcc41341d126720ee6a26db5b824c90b24) |
[Successful deployment](https://github.com/Zanark/BowserBoyAdvance/actions/runs/42115330741)

## What is included

- An actual 3D tabletop handheld: pick up, inspect, zoom, insert a cartridge,
  operate physical controls/power, and choose room, lantern or LCD lighting.
- Local-ROM GBA playback through pinned EmulatorJS/mGBA, native audio,
  remappable controls, nine CRT presets, speed controls and hold-Space boost.
- Browser-local saves, automatic checkpoints, three manual slots and portable
  `.bba-save` backup import/export.
- Desk and LCD fullscreen, a movable/collapsible tools dock, animated console
  inspection branding, and outside-click settings dismissal.
- Sharp device-aware rendering at `min(devicePixelRatio, 2)`. Performance
  recovery schedules room redraws; it never automatically lowers resolution.

Only the GBA console is implemented. No feature or artwork is removed for
this release milestone.

## Release identity and evidence

| Field | Value |
|---|---|
| Release label | v1.0.0 |
| Qualified application revision | `c3d9dbdcc41341d126720ee6a26db5b824c90b24` |
| Hosted run | `42115330741`: build, all 53 browser cases across ten jobs, deployment passed |
| Observed queue-to-deployment | 6m18s; not a controlled parallelism-speedup comparison |
| Public assets | All 30 deployed assets matched the qualified revision |
| Public sharpness | 2880x2200 backing buffer for 1440x1100 CSS at 2x after forced stalls; captures reviewed |
| Public affected paths | Five cases passed: native saves/import/autosave/isolation, mapped controls/light, desktop/mobile insertion and renderer |

The package and lockfile now label this milestone 1.0.0. The qualified
application predates that metadata change; no 1.0.0-tagged deployment or
GitHub Release is claimed. This is a technical/public release milestone,
not universal device compatibility or approval of every visual detail.

## Local release package

`BowserBOYADVANCED-v1.0.0-static.zip` contains the allowlisted static build
at its root, plus `RELEASE-NOTES.md` and `THIRD_PARTY_NOTICES.md`.
`manifest.json` identifies every archive entry by size and SHA-256, with a
separate archive hash in `SHA256SUMS.txt`. Hashes detect changed bytes, not
authorship or a digital signature. These generated ZIP bytes are local until
explicitly uploaded; the live website is already public.

Extract the ZIP into a dedicated directory and serve that directory with an
HTTP static server, or upload its contents to a static host. Do not open it
with `file://`. Keep the directory layout intact, including `.nojekyll` and
`vendor/THREE-LICENSE.txt`.

The archive is **not an offline emulator bundle**: EmulatorJS 4.2.3 and its
native core are fetched from the upstream CDN. Internet access is required.
It includes the original Pixel Lab demonstration program, not a commercial
ROM collection, BIOS, supplied media ROM, box art, recordings, private context,
tests or development dependencies.

Local progress belongs to the browser's origin. Moving to a different host,
port or browser does not move saves; export backups before changing origins.
Browser storage can be cleared or unavailable. Performance depends on the
device/browser; desktop and simulated phone viewports are not physical-phone
certification.

## Source, notices and rebuilding

The build entry is `scripts/build.mjs`, whose allowlist is
`scripts/site-files.mjs`. From the matching source checkout, use Node >=22,
restore the locked dependencies if absent, then run `npm run build`.
The frozen package reads tracked application bytes from the qualified Git
revision, preserving the deployed LF bytes rather than Windows checkout CRLF.
Generated Pixel Lab and unmodified vendor files come from the checked build;
all 30 site entries are compared with the public qualification hashes.
The archive adds only this release note and the existing third-party notice;
it does not mirror upstream emulator binaries. Consult
[third-party notices](https://github.com/Zanark/BowserBoyAdvance/blob/c3d9dbdcc41341d126720ee6a26db5b824c90b24/THIRD_PARTY_NOTICES.md)
for source/license links and supplied-artwork provenance. Links inside the
copied notice refer to the source repository; media/demo directories are
intentionally not included in the static package.

No new blanket source or artwork license is granted by the version number.
Preserve bundled notices and review upstream obligations before mirroring or
redistributing additional runtime components.
