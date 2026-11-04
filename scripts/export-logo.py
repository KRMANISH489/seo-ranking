from pathlib import Path

from PIL import Image

src = Path(r"C:\Users\Dell\.cursor\projects\d-test-seo-ranking\assets\codabhi-seo-mark.jpg")
root = Path(r"d:\test\seo-ranking")
img = Image.open(src).convert("RGBA")

w, h = img.size
side = min(w, h)
left = (w - side) // 2
top = (h - side) // 2
img = img.crop((left, top, left + side, top + side))

outs = [
    (root / "public" / "codabhi-logo.png", 512),
    (root / "public" / "codabhi-mark.png", 256),
    (root / "public" / "icon-32.png", 32),
    (root / "public" / "apple-touch-icon.png", 180),
    (root / "src" / "app" / "icon.png", 32),
    (root / "src" / "app" / "apple-icon.png", 180),
]

for path, size in outs:
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(path, "PNG", optimize=True)
    print(f"wrote {path} {size}x{size}")
