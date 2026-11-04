# README media

[Visual showcase](../README.md) | [Player and developer guide](GUIDE.md)

The README is a visual front page: animation, images and short captions.
Setup, controls, limitations and release history belong in the linked guides.
This is the user's explicit policy for this repository, not a portfolio-wide rule.

## Sources and boundaries

- `images/orbital-logo.gif` animates the supplied transparent purple logo and the
  supplied sparkle, glow and orbit effects on a transparent background, without
  a purple rectangular backdrop or background starfield. GIF supports binary transparency, so soft
  alpha edges are thresholded for encoding; the supplied source remains unchanged.
  Its elliptical star motion is an original README presentation, not a recording
  of the LCD boot. The separate power-on GIF retains the actual purple LCD scene.
- The other GIFs are actual recordings of the deployed application, captured
  with Playwright/Edge at 1100 by 850 and encoded at 800 by 618, 10 fps.
  Pickup/inspection, power-on, physical insertion and lighting use actual UI
  actions, not rendered mockups or artificial interpolation. Trailing idle holds
  are trimmed; clip timings are not performance metrics.
- Insertion deliberately holds the native loader download until the cartridge
  seats, making the real download-phase motion visible. It is not a measurement
  of normal network loading time.
- Only the original Pixel Lab cartridge is used. No commercial ROMs, gameplay,
  private browser state or recordings are included.
- GIFs are silent and loop. Their captions and alt text describe the motion.
  GitHub does not expose a per-image pause control; static alternatives are
  available in the [player guide](GUIDE.md).
- Documentation images are not part of the static application's build allowlist.

Earlier versions of all four interaction GIFs, and the startup/pose/dock figures, were
refreshed from deployed source `807da8ef42594d3e0b2f8b788f66bed894483d21`,
after independently matching all 28 public assets and passing five actual
production cases. The new footage shows monochrome bezel print, raised ZANARK
lettering, header notices, distinct icons and the sharp waving startup.
Sampled encoded beginning/middle/end frames were reviewed: pickup reaches the
back and returns, boot ends on the idle LCD rather than the next drawer action,
the original cartridge visibly seats, and independent lights actually change.
No retiming or commercial game footage is used. The existing transparent logo
banner is unchanged.
The updated README banner and power-on embeds use media-revision query
parameters so replacements have distinct image URLs without duplicating assets.

The fullscreen figure was subsequently refreshed from actual deployed source
`faece42da7563a74d39e1513ebeb7be543300ec0`, after the complete 38-case release
gate, independent 28-asset match and four real public-browser cases passed.
It shows the complete native framebuffer, proportional CSS bezel and bottom-right
50-100% zoom. Actual pixels are checked before/after real input; this is not
a second emulator or another rendering of the 3D room. The capture was reviewed.
Only this affected figure changed; the interaction GIFs above remain unchanged.

The underside detail and affected desktop/mobile, native-settings and
LCD-light/power-off figures were subsequently refreshed from actual public
source `ba49d559688713d485d2c27b593faed9692913ae`, after fresh Pages
`41853556614` passed build, 11 units, all 39 browser cases and deployment,
and all 28 exact public assets independently matched. Seven public cases
passed in the first batch; its lighting fixture clicked before scene readiness.
After correcting that setup, the actual public lighting case passed in 29.0s.
The underside detail uses actual Inspect/keyboard tilt and Room lights to
show the complete physical assembly on the lower shell edge. It and the five
refreshed figures were reviewed. Both actual native insertion cases also
verify that the newly protruding cap clears the tabletop while lowered.
At that milestone the interaction GIFs still predated the relocation. The
explicit README refresh below subsequently replaces all four and the dock;
earlier static startup/pose figures retain their original provenance.

## Current README refresh

The four interaction GIFs now show the actual current public application,
including the underside power assembly, rather than the earlier front switch.
The original recording and timing receipt were captured on 2026-11-04 at
15:26:45 UTC from the public URL. Application bytes correspond to the verified
`ba49d559688713d485d2c27b593faed9692913ae` release above; subsequent
documentation/test-fixture-only source `6580a34` leaves those bytes unchanged.
The original Pixel Lab is the only cartridge, and the capture reports zero
page errors.

The new encoded clips contain 109 pickup/inspection frames, 44 power-on frames,
27 insertion frames and 54 lighting frames at 10 fps. Largest output is
5.19 MiB; every GIF remains below 10 MiB. Sampled beginning/middle/end frames
were reviewed, with additional rear-hold and lights-off samples where the
midpoint alone was ambiguous. Inspection visibly reaches the battery cover
and returns; boot ends at the idle LCD, insertion seats, and lights switch
independently. Clip timings are still not performance measurements.

The new `crt-presets.png` captures the actual open host selector: all nine
native presets, Unfiltered and selected CRT Geom. `quick-controls.png` is a
fresh actual live dock capture. The README also reuses the already-reviewed
actual underside detail and complete fullscreen/zoom figure described above.
The transparent animated banner is deliberately unchanged. Media-revision
URLs refresh the replaced embeds; detailed prose stays in linked guides.

## Complete effects, not logo fragments

The earlier moving star was cropped from the logo, leaving neighboring orbit
segments and hard-cut arms. Its replacement comes from the user's **Purple Neon
Sparkle and Orbital Sprite Sheet**, supplied on 2026-11-04: 2172x724 RGBA,
SHA-256 `1233f8ee8981b4e85869f672e2361b9c80f39b34762d70730174a11da4c67542`.

| Output | Source rectangle, exclusive right/bottom | Transparent output |
|---|---|---|
| `assets/star.png` | `(690,100)-(875,302)` | 256x256 |
| `assets/glow.png` | `(1640,138)-(1768,267)` | 160x160 |
| `assets/orbit.png` | `(0,512)-(640,724)` | 660x240 |

`scripts/extract-orbital-sprites.py` removes only near-invisible alpha<=1 noise,
rejects crops touching visible content, preserves the remaining colors/alpha,
and centers each complete effect with transparent padding. The supplied source
and logo stay unchanged. Natural passing behind the wordmark is intentional
occlusion, not a crop cutoff.

The LCD orbit is inset far enough to contain every rotated sparkle throughout
the reveal. Browser checks cover the full 3200ms animation at 100ms steps,
transparent sprite margins and the unchanged static reduced-motion presentation.
Every encoded README banner frame also clears an 8px outer canvas margin.
The centered banner artwork is 620px wide inside a 960px outer orbit on the
1000x340 canvas. The LCD uses 160px artwork inside a 226px ring. This leaves
clear breathing room instead of stretching the wordmark against the orbit.
Browser checks also retain centered placement and logo width below 75% of the
ring throughout the startup reveal.

## Reproduce

The existing Node dependencies provide Playwright. Install Edge, Python with
Pillow, and FFmpeg for this optional documentation workflow; these are not
requirements for playing or building the website.

From the repository root, provide your own scratch output directory:

```powershell
python scripts\extract-orbital-sprites.py "C:\art\Purple Neon Sparkle and Orbital Sprite Sheet.png"
node scripts\capture-readme.mjs C:\scratch\bba-readme
python scripts\render-readme.py --capture C:\scratch\bba-readme\capture.json --ffmpeg C:\tools\ffmpeg.exe
```

Use the actual supplied sheet and FFmpeg executable paths on your machine.
Set `BBA_CAPTURE_URL` to record a different running build, or `BROWSER_CHANNEL` to select an installed
Playwright browser channel. The default capture URL is the public website.
The capture writes an original WebM and a receipt of clip timings; the encoder
writes the five GIFs to `docs\images`. The capture also saves table/play/rear
pose PNGs in the scratch output directory. Running only
`python scripts\render-readme.py` regenerates the logo banner without FFmpeg.

Review the encoded motion before replacing public assets. A successful encoder
or a single thumbnail alone does not establish that the action is visible.
Original capture videos and timing receipts remain local working artifacts;
only the reviewed GIFs are published.
