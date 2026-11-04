"""Render the supplied-logo banner and encode real browser clips for the README."""

import argparse
import json
import math
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "images"


def banner():
    width, height = 1000, 340
    logo = Image.open(ROOT / "assets" / "logo.png").convert("RGBA")
    logo.thumbnail((850, 285), Image.Resampling.LANCZOS)
    star = Image.open(ROOT / "assets" / "star.png").convert("RGBA")
    frames = []
    for frame in range(72):
        phase = frame / 72 * math.tau
        image = Image.new("RGBA", (width, height))
        draw = ImageDraw.Draw(image)
        for radius, color in [(1, (116, 67, 174, 255)), (.97, (55, 33, 89, 255))]:
            draw.ellipse((500 - 466 * radius, 170 - 110 * radius,
                          500 + 466 * radius, 170 + 110 * radius), outline=color, width=1)
        orbiters = []
        for number in range(3):
            angle = phase + number * math.tau / 3
            orbiters.append((angle, 500 + 466 * math.cos(angle), 170 + 110 * math.sin(angle)))

        def paint_star(angle, x, y):
            size = int(29 + 10 * (math.sin(angle) + 1))
            sprite = star.resize((size, size), Image.Resampling.LANCZOS)
            halo = Image.new("RGBA", image.size)
            ImageDraw.Draw(halo).ellipse((x - size / 2, y - size / 2, x + size / 2, y + size / 2),
                                        fill=(158, 69, 255, 110))
            image.alpha_composite(halo.filter(ImageFilter.GaussianBlur(12)))
            image.alpha_composite(sprite, (round(x - size / 2), round(y - size / 2)))

        for angle, x, y in orbiters:
            if math.sin(angle) < 0:
                paint_star(angle, x, y)
        image.alpha_composite(logo, ((width - logo.width) // 2, (height - logo.height) // 2))
        for angle, x, y in orbiters:
            if math.sin(angle) >= 0:
                paint_star(angle, x, y)
        frames.append(image)
    palette = frames[0].convert("RGB").quantize(colors=255)
    encoded = []
    for frame in frames:
        indexed = frame.convert("RGB").quantize(palette=palette, dither=Image.Dither.NONE)
        indexed = indexed.point(lambda index: index + 1)
        indexed.putpalette([0, 0, 0] + palette.getpalette()[:765])
        indexed.paste(0, mask=frame.getchannel("A").point(lambda alpha: 255 if alpha < 128 else 0))
        encoded.append(indexed)
    encoded[0].save(OUTPUT / "orbital-logo.gif", save_all=True, append_images=encoded[1:],
                    duration=70, loop=0, optimize=False, disposal=2, transparency=0, background=0)


def clips(receipt, ffmpeg):
    capture = json.loads(receipt.read_text(encoding="utf-8"))
    if capture["errors"]:
        raise RuntimeError(f"Browser capture failed: {capture['errors']}")
    for name, clip in capture["clips"].items():
        if "duration" not in clip:
            raise RuntimeError(f"Incomplete capture: {name}")
        subprocess.run([
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
            "-ss", str(clip["start"]), "-t", str(clip["duration"] - .5), "-i", capture["video"],
            "-filter_complex",
            "fps=10,scale=800:-1:flags=lanczos,split[a][b];"
            "[a]palettegen=max_colors=128:stats_mode=diff[p];"
            "[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle",
            "-loop", "0", str(OUTPUT / f"{name}.gif"),
        ], check=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--capture", type=Path, help="capture.json from capture-readme.mjs")
    parser.add_argument("--ffmpeg", default=shutil.which("ffmpeg"), help="Path to an FFmpeg executable")
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    banner()
    if args.capture:
        if not args.ffmpeg:
            parser.error("--capture requires ffmpeg on PATH or an explicit --ffmpeg path")
        clips(args.capture, args.ffmpeg)
    print("README media rendered in", OUTPUT)
