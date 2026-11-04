# README media

[Visual showcase](../README.md) | [Player and developer guide](GUIDE.md)

The README is a visual front page: animation, images and short captions.
Setup, controls, limitations and release history belong in the linked guides.
This is the user's explicit policy for this repository, not a portfolio-wide rule.

## Sources and boundaries

- `images/orbital-logo.gif` animates the supplied transparent purple logo and its
  derived star sprite on a transparent background, without a purple rectangular
  backdrop or background starfield. GIF supports binary transparency, so soft
  alpha edges are thresholded for encoding; the supplied source remains unchanged.
  Its elliptical star motion is an original README presentation, not a recording
  of the LCD boot. The separate power-on GIF retains the actual purple LCD scene.
- The other GIFs are actual recordings of the deployed application, captured
  with Playwright/Edge at 1100 by 850 and encoded at 800 by 618, 10 fps.
  Pickup/inspection, power-on, physical insertion and lighting use actual UI
  actions, not rendered mockups or artificial interpolation. The last half-second
  of each trailing idle hold is trimmed; clip timings are not performance metrics.
- Insertion deliberately holds the native loader download until the cartridge
  seats, making the real download-phase motion visible. It is not a measurement
  of normal network loading time.
- Only the original Pixel Lab cartridge is used. No commercial ROMs, gameplay,
  private browser state or recordings are included.
- GIFs are silent and loop. Their captions and alt text describe the motion.
  GitHub does not expose a per-image pause control; static alternatives are
  available in the [player guide](GUIDE.md).
- Documentation images are not part of the static application's build allowlist.

## Reproduce

The existing Node dependencies provide Playwright. Install Edge, Python with
Pillow, and FFmpeg for this optional documentation workflow; these are not
requirements for playing or building the website.

From the repository root, provide your own scratch output directory:

```powershell
node scripts\capture-readme.mjs C:\scratch\bba-readme
python scripts\render-readme.py --capture C:\scratch\bba-readme\capture.json --ffmpeg C:\tools\ffmpeg.exe
```

Use the actual FFmpeg executable path on your machine. Set `BBA_CAPTURE_URL` to
record a different running build, or `BROWSER_CHANNEL` to select an installed
Playwright browser channel. The default capture URL is the public website.
The capture writes an original WebM and a receipt of clip timings; the encoder
writes the five GIFs to `docs\images`. Running only
`python scripts\render-readme.py` regenerates the logo banner without FFmpeg.

Review the encoded motion before replacing public assets. A successful encoder
or a single thumbnail alone does not establish that the action is visible.
Original capture videos and timing receipts remain local working artifacts;
only the reviewed GIFs are published.
