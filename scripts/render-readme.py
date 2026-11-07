"""Render README logos/banners and encode real browser clips."""

import argparse
import json
import math
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "images"


def logo_glow(image, color):
    radius = image.width * .01
    padding = math.ceil(radius * 4)
    original = Image.new("RGBA", (image.width + padding * 2, image.height + padding * 2))
    original.alpha_composite(image, (padding, padding))
    alpha = original.getchannel("A")
    result = Image.new("RGBA", original.size)
    for blur, strength in [(radius, .8), (radius * .28, .6)]:
        halo = Image.new("RGBA", original.size, (*color, 0))
        halo.putalpha(alpha.filter(ImageFilter.GaussianBlur(blur)).point(lambda value: round(value * strength)))
        result.alpha_composite(halo)
    result.alpha_composite(original)
    return result


def glowing_logos():
    with Image.open(ROOT / "assets" / "website-logo.png") as source:
        logo_glow(source.convert("RGBA"), (255, 255, 255)).save(OUTPUT / "bowserboy-logo-glow.png")
    frames, durations = [], []
    with Image.open(OUTPUT / "orbital-logo.gif") as source:
        loop = source.info["loop"]
        for index in range(source.n_frames):
            source.seek(index)
            frames.append(logo_glow(source.convert("RGBA"), (169, 65, 255)))
            durations.append(source.info["duration"])
    frames[0].save(OUTPUT / "bowserboyadvanced-logo-glow.png", save_all=True,
                   append_images=frames[1:], duration=durations, loop=loop, disposal=0, blend=0)


def shimmering_logo():
    with Image.open(ROOT / "assets" / "website-logo.png") as source:
        image = source.convert("RGBA")
    image.thumbnail((1080, 1080), Image.Resampling.LANCZOS)
    highlight = logo_glow(ImageEnhance.Brightness(image).enhance(1.7), (255, 255, 255))
    padding = (highlight.width - image.width) // 2
    base = Image.new("RGBA", highlight.size)
    base.alpha_composite(image, (padding, padding))
    frames, durations = [base], [900]
    for step in range(36):
        # Match the website's 300%-wide mask, moving from 100% to 0%.
        center = padding + image.width * (-.5 + 2 * step / 36)
        row = Image.new("L", (base.width, 1))
        row.putdata([
            round(255 * max(0, 1 - abs(x - center) / (image.width * .24)))
            for x in range(base.width)
        ])
        mask = row.resize(base.size)
        sweep = highlight.copy()
        sweep.putalpha(ImageChops.multiply(highlight.getchannel("A"), mask))
        frame = base.copy()
        frame.alpha_composite(sweep)
        frames.append(frame)
        durations.append(50)
    frames.append(base)
    durations.append(300)
    frames[0].save(OUTPUT / "bowserboy-logo-shimmer.png", save_all=True,
                   append_images=frames[1:], duration=durations, loop=0, disposal=0, blend=0)


def shimmering_ds_screens():
    with Image.open(ROOT / "assets" / "ds-logo.png") as source:
        image = source.convert("RGBA")
    if image.size != (2149, 732):
        raise ValueError("DS screen masks require the original 2149x732 artwork.")
    screens = Image.new("L", image.size)
    draw = ImageDraw.Draw(screens)
    # Stay inside the glass: the chrome rims, lettering and orbit never animate.
    for polygon in [
        [(1386, 266), (1584, 266), (1547, 348), (1349, 348)],
        [(1322, 398), (1534, 398), (1495, 480), (1285, 480)],
    ]:
        draw.polygon(polygon, fill=255)
    highlight = Image.blend(image, Image.new("RGBA", image.size, (229, 253, 255, 255)), .72)
    highlight.putalpha(image.getchannel("A"))
    frames, durations = [image], [900]
    left, top, right, bottom = screens.getbbox()
    for step in range(32):
        center = 1190 + 500 * step / 31
        band = Image.new("L", image.size)
        for y in range(top, bottom):
            row = Image.new("L", (right - left, 1))
            row.putdata([
                round(255 * max(0, 1 - abs(x + .45 * (y - 370) - center) / 38))
                for x in range(left, right)
            ])
            band.paste(row, (left, y))
        frames.append(Image.composite(highlight, image, ImageChops.multiply(screens, band)))
        durations.append(50)
    frames.append(image)
    durations.append(500)
    frames[0].save(ROOT / "assets" / "ds-logo-shimmer.png", save_all=True,
                   append_images=frames[1:], duration=durations, loop=0, disposal=0, blend=0)


def banner():
    width, height = 1000, 340
    logo = Image.open(ROOT / "assets" / "logo.png").convert("RGBA")
    logo.thumbnail((620, 220), Image.Resampling.LANCZOS)
    star = Image.open(ROOT / "assets" / "star.png").convert("RGBA")
    glow = Image.open(ROOT / "assets" / "glow.png").convert("RGBA")
    ring = Image.open(ROOT / "assets" / "orbit.png").convert("RGBA")
    ring = ring.resize((960, 280), Image.Resampling.LANCZOS)
    frames = []
    for frame in range(72):
        phase = frame / 72 * math.tau
        image = Image.new("RGBA", (width, height))
        image.alpha_composite(ring, (20, 30))
        orbiters = []
        for number in range(3):
            angle = phase + number * math.tau / 3
            orbiters.append((angle, 500 + 440 * math.cos(angle), 170 + 92 * math.sin(angle)))

        def paint_star(angle, x, y):
            size = int(42 + 10 * (math.sin(angle) + 1))
            sprite = star.resize((size, size), Image.Resampling.LANCZOS)
            pulse = int(size * (1.1 + .1 * math.sin(phase * 2 + angle)))
            halo = glow.resize((pulse, pulse), Image.Resampling.LANCZOS)
            image.alpha_composite(halo, (round(x - pulse / 2), round(y - pulse / 2)))
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
    parser.add_argument("--glow-logos", action="store_true", help="Only render README logo glows; preserve original media")
    parser.add_argument("--shimmer-logo", action="store_true", help="Only animate the current BowserBOY website logo for the README")
    parser.add_argument("--ds-screen-shimmer", action="store_true", help="Only animate the two DS logo screen interiors for the README and Inspect")
    args = parser.parse_args()
    if args.glow_logos and args.capture:
        parser.error("--glow-logos cannot be combined with --capture")
    if args.shimmer_logo and (args.glow_logos or args.capture):
        parser.error("--shimmer-logo cannot be combined with --glow-logos or --capture")
    if args.ds_screen_shimmer and (args.shimmer_logo or args.glow_logos or args.capture):
        parser.error("--ds-screen-shimmer cannot be combined with other render modes")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if args.ds_screen_shimmer:
        shimmering_ds_screens()
    elif args.shimmer_logo:
        shimmering_logo()
    elif args.glow_logos:
        glowing_logos()
    elif args.capture:
        if not args.ffmpeg:
            parser.error("--capture requires ffmpeg on PATH or an explicit --ffmpeg path")
        clips(args.capture, args.ffmpeg)
    else:
        banner()
    print("README media rendered in", OUTPUT)
