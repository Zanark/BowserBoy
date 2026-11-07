import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser(description="Compose actual factory captures, not generated model artwork.")
parser.add_argument("--review", required=True, type=Path)
args = parser.parse_args()
book = Path(__file__).resolve().parents[1]
atlas = book / "assets" / "atlas"
models = [("gba", "Game Boy Advance"), ("ds", "Nintendo DS"),
          ("pear", "Pear Boy"), ("axolotl", "Axolotl"),
          ("lamp", "Tripod lamp"), ("cartridge", "Cartridge")]
font = ImageFont.load_default(size=20)
sheet = Image.new("RGB", (1050, 6 * 310), "#eeeade")
cover = Image.new("RGB", (1600, 800), "#eeeade")
for row, (model, label) in enumerate(models):
    for column, view in enumerate(["front", "back", "three-quarter"]):
        image = Image.open(atlas / f"{model}-{view}.png").convert("RGB")
        image.thumbnail((340, 272))
        origin = (column * 350 + 5, row * 310)
        sheet.paste(image, origin)
        ImageDraw.Draw(sheet).text((origin[0] + 8, origin[1] + 276),
                                  f"{label} / {view}", fill="#24483a", font=font)
    image = Image.open(atlas / f"{model}-three-quarter.png").convert("RGB")
    image.thumbnail((475, 355))
    x = (row % 3) * 533 + (533 - image.width) // 2
    y = (row // 3) * 400 + 4
    cover.paste(image, (x, y))
    ImageDraw.Draw(cover).text(((row % 3) * 533 + 30, y + 359),
                              label, fill="#24483a", font=font)
args.review.mkdir(parents=True, exist_ok=True)
sheet.save(args.review / "atlas-contact.png")
cover.save(book / "assets" / "model-atlas.png")
manifest = json.loads((atlas / "capture-manifest.json").read_text(encoding="utf-8"))
print(json.dumps({"captures": len(manifest["captures"]),
                  "cover": "docs/modeling-book/assets/model-atlas.png",
                  "review": str(args.review / "atlas-contact.png")}))
