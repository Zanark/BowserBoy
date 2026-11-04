"""Extract complete, padded effects from the supplied 2172x724 RGBA sprite sheet."""

import argparse
from pathlib import Path

from PIL import Image


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    sheet = Image.open(args.source).convert("RGBA")
    if sheet.size != (2172, 724):
        parser.error("Expected the supplied 2172x724 sprite sheet; crop coordinates must not be guessed.")
    output = Path(__file__).resolve().parents[1] / "assets"
    for name, rect, size, inset in [
        ("star.png", (690, 100, 875, 302), (256, 256), 24),
        ("orbit.png", (0, 512, 640, 724), (660, 240), 24),
        ("glow.png", (1640, 138, 1768, 267), (160, 160), 16),
    ]:
        sprite = sheet.crop(rect)
        alpha = sprite.getchannel("A").point(lambda value: 0 if value <= 1 else value)
        sprite.putalpha(alpha)
        bounds = alpha.getbbox()
        if not bounds or min(bounds[:2]) <= 0 or bounds[2] >= sprite.width or bounds[3] >= sprite.height:
            raise ValueError(f"{name}: crop touches visible content; do not truncate the effect.")
        sprite = sprite.crop(bounds)
        sprite.thumbnail((size[0] - inset * 2, size[1] - inset * 2), Image.Resampling.LANCZOS)
        padded = Image.new("RGBA", size)
        padded.alpha_composite(sprite, ((size[0] - sprite.width) // 2, (size[1] - sprite.height) // 2))
        padded.save(output / name, optimize=True)
        print(f"{name}: complete source bounds {bounds}, padded output {size}")
