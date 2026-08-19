"""Convert heavy public PNG artwork to transparent WebP for production.

Run from the app directory: python tools/optimize-images.py
Original PNG files are retained as editable masters; Vite copies both formats,
while runtime code requests the WebP variants.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public"
GROUPS = {
    "scenes": (ROOT / "scenes", 80),
    "landmarks": (ROOT / "landmarks", 82),
    "textures": (ROOT / "textures", 78),
    "cartography": (ROOT / "assets" / "cartography", 86),
}

for label, (folder, quality) in GROUPS.items():
    before = after = count = 0
    for source in folder.rglob("*.png"):
        target = source.with_suffix(".webp")
        with Image.open(source) as image:
            image.save(target, "WEBP", quality=quality, method=6, exact=True)
        before += source.stat().st_size
        after += target.stat().st_size
        count += 1
    if count:
        print(f"{label:12} {count:2} files: {before/1048576:6.2f} MB -> {after/1048576:6.2f} MB ({after/before:.1%})")
