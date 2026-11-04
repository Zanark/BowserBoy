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

All four interaction GIFs and the current startup, pose and dock figures were
refreshed from deployed source `807da8ef42594d3e0b2f8b788f66bed894483d21`,
after independently matching all 28 public assets and passing five actual
production cases. The new footage shows monochrome bezel print, raised ZANARK
lettering, header notices, distinct icons and the sharp waving startup.
Sampled encoded beginning/middle/end frames were reviewed: pickup reaches the
back and returns, boot ends on the idle LCD rather than the next drawer action,
the original cartridge visibly seats, and independent lights actually change.
No retiming or commercial game footage is used. The existing transparent logo
banner is unchanged. The fullscreen figure is the same actual native framebuffer
checked before/after real input, not a second emulator or 3D scene screenshot.
The updated README banner and power-on embeds use media-revision query
parameters so replacements have distinct image URLs without duplicating assets.

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
