"""Render the supplied-logo banner and encode real browser clips for the README."""

import argparse
import json
import math
import random
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "images"


def banner():
    width, height = 1000, 340
    background = Image.new("RGB", (width, height))
    pixels = background.load()
    for y in range(height):
        for x in range(width):
            glow = max(0, 1 - math.hypot((x - 500) / 640, (y - 175) / 240))
            pixels[x, y] = (int(13 + glow * 20), int(9 + glow * 9), int(26 + glow * 35))
    rng = random.Random(42)
    stars = [(rng.randrange(width), rng.randrange(height), rng.random()) for _ in range(65)]
    logo = Image.open(ROOT / "assets" / "logo.png").convert("RGBA")
    logo.thumbnail((850, 285), Image.Resampling.LANCZOS)
    star = Image.open(ROOT / "assets" / "star.png").convert("RGBA")
    frames = []
    for frame in range(72):
        phase = frame / 72 * math.tau
        image = background.convert("RGBA")
        draw = ImageDraw.Draw(image)
        for x, y, offset in stars:
            brightness = int(95 + 60 * math.sin(phase + offset * math.tau))
            draw.ellipse((x, y, x + 1, y + 1), fill=(brightness, brightness, min(255, brightness + 55)))
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
        frames.append(image.convert("RGB"))
    palette = frames[0].quantize(colors=256)
    encoded = [frame.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for frame in frames]
    encoded[0].save(OUTPUT / "orbital-logo.gif", save_all=True, append_images=encoded[1:],
                    duration=70, loop=0, optimize=True, disposal=1)


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
