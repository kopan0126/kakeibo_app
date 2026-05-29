#!/usr/bin/env python
"""
Kakeibo App Icon Generator — Aizome (藍染) Theme
=================================================
Generates:
  icon.png          1024×1024  iOS icon (full bg)
  adaptive-icon.png 1024×1024  Android adaptive foreground (transparent bg)
  favicon.png         64×64    Web favicon
  splash-icon.png    512×512   Splash logo (transparent bg, for washi backdrop)

Design language:
  Background : indigo  #15243F
  Ring/accent: brass   #C9A55C
  Inner hex  : indigo2 #1f3358
  Kanji text : washi   #F1E8D3
  Pattern    : AsanohaBg diamond grid (same as app's AsanohaBg.tsx)
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

# ── Palette ────────────────────────────────────────────────────────────────
INDIGO  = (21,  36,  63)   # #15243F
INDIGO2 = (31,  51,  88)   # #1f3358
WASHI   = (241, 232, 211)  # #F1E8D3
BRASS   = (201, 165, 92)   # #C9A55C

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")

# ── Font ────────────────────────────────────────────────────────────────────
def get_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/YuGothB.ttc",
        "C:/Windows/Fonts/meiryob.ttc",
        "C:/Windows/Fonts/BIZ-UDGothicB.ttc",
        "C:/Windows/Fonts/msgothic.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

# ── Asanoha pattern (mirrors AsanohaBg.tsx) ─────────────────────────────────
def make_asanoha_layer(canvas: int, tile: int = 100, alpha: int = 45) -> Image.Image:
    """
    Replicates the SVG pattern from AsanohaBg.tsx:
      Diamond outline: M0,h L h,0 L t,h L h,t Z
      Cross lines:     center → each vertex
    where t = tile size, h = tile/2.
    """
    layer = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    c = BRASS + (alpha,)
    lw = max(1, tile // 55)
    h = tile // 2

    for row in range(-1, canvas // tile + 2):
        for col in range(-1, canvas // tile + 2):
            x0, y0 = col * tile, row * tile
            cx, cy = x0 + h, y0 + h
            # Diamond corners
            top    = (cx,      y0)
            right  = (x0 + tile, cy)
            bottom = (cx,      y0 + tile)
            left   = (x0,      cy)
            # Outline
            d.line([left, top, right, bottom, left], fill=c, width=lw)
            # Cross from center
            for vx, vy in (top, right, bottom, left):
                d.line([(cx, cy), (vx, vy)], fill=c, width=lw)
    return layer

# ── Circle helpers ───────────────────────────────────────────────────────────
def draw_circle_ring(draw: ImageDraw.ImageDraw, cx, cy,
                     r_outer: float, ring_frac: float,
                     ring_color, inner_color):
    """Brass circle ring + filled inner circle."""
    r_inner = r_outer * (1 - ring_frac)
    draw.ellipse(
        (cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer),
        fill=ring_color + (255,),
    )
    draw.ellipse(
        (cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner),
        fill=inner_color + (255,),
    )

# ── Small decorative details ─────────────────────────────────────────────────
def draw_inner_details(draw: ImageDraw.ImageDraw, cx, cy, r_inner: float):
    """Six small brass dots evenly spaced around the inner circle edge."""
    dot_r = max(2, int(r_inner * 0.04))
    c = BRASS + (200,)
    for i in range(6):
        angle = math.radians(60 * i - 90)
        px = cx + r_inner * 0.90 * math.cos(angle)
        py = cy + r_inner * 0.90 * math.sin(angle)
        draw.ellipse(
            (px - dot_r, py - dot_r, px + dot_r, py + dot_r),
            fill=c,
        )

# ── Core render function ─────────────────────────────────────────────────────
def render(
    canvas: int,
    r_frac: float,        # hex outer radius as fraction of canvas/2
    ring_frac: float,     # ring thickness as fraction of outer radius
    transparent_bg: bool,
    tile_frac: float = 0.10,   # asanoha tile as fraction of canvas
) -> Image.Image:
    """
    Render at `canvas` pixels (high-res), then caller downsizes for AA.
    transparent_bg=True → no indigo background (for adaptive-icon / splash).
    """
    bg_color = (0, 0, 0, 0) if transparent_bg else INDIGO + (255,)
    img = Image.new("RGBA", (canvas, canvas), bg_color)

    # Asanoha background pattern (only on opaque icons)
    if not transparent_bg:
        pattern = make_asanoha_layer(canvas, tile=int(canvas * tile_frac), alpha=40)
        img = Image.alpha_composite(img, pattern)

    draw = ImageDraw.Draw(img)
    cx = cy = canvas / 2
    r_outer = canvas / 2 * r_frac
    inner_col = INDIGO2 if not transparent_bg else INDIGO

    draw_circle_ring(draw, cx, cy, r_outer, ring_frac, BRASS, inner_col)
    draw_inner_details(draw, cx, cy, r_outer * (1 - ring_frac))

    # Kanji 家
    font_size = int(r_outer * (1 - ring_frac) * 1.25)
    font = get_font(font_size)
    draw.text(
        (cx, cy + canvas * 0.015),
        "家",
        font=font,
        fill=WASHI + (255,),
        anchor="mm",
    )

    return img


def make_and_save(filename: str, output_size: int, **render_kwargs):
    canvas = output_size * 2          # render 2× for AA
    img = render(canvas, **render_kwargs)
    img = img.resize((output_size, output_size), Image.LANCZOS)
    path = os.path.join(ASSETS_DIR, filename)
    img.save(path, "PNG", optimize=True)
    kb = os.path.getsize(path) // 1024
    print(f"  OK {filename:<26} {output_size}x{output_size}  ({kb} KB)  -> {path}")


# ── Favicon variant (no hex ring, just clean square) ─────────────────────────
def make_favicon(output_size: int = 64):
    canvas = output_size * 4
    img = Image.new("RGBA", (canvas, canvas), INDIGO + (255,))
    draw = ImageDraw.Draw(img)
    cx = cy = canvas / 2

    # Simple circle fill
    r = canvas / 2 * 0.80
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=BRASS + (255,))
    r2 = r * 0.72
    draw.ellipse((cx - r2, cy - r2, cx + r2, cy + r2), fill=INDIGO + (255,))

    font_size = int(r2 * 1.35)
    font = get_font(font_size)
    draw.text((cx, cy + canvas * 0.02), "家", font=font, fill=WASHI + (255,), anchor="mm")

    img = img.resize((output_size, output_size), Image.LANCZOS)
    path = os.path.join(ASSETS_DIR, "favicon.png")
    img.save(path, "PNG", optimize=True)
    kb = os.path.getsize(path) // 1024
    print(f"  OK {'favicon.png':<26} {output_size}x{output_size}  ({kb} KB)  -> {path}")


# ── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    os.makedirs(ASSETS_DIR, exist_ok=True)
    print("\nGenerating Kakeibo icon assets (Aizome theme)...\n")

    # icon.png — full iOS icon with indigo bg + pattern
    make_and_save(
        "icon.png",
        output_size=1024,
        r_frac=0.76,
        ring_frac=0.09,
        transparent_bg=False,
    )

    # adaptive-icon.png — Android adaptive foreground (transparent bg)
    # Visual content within ~60% of canvas (Android safe zone ≈ 66%)
    make_and_save(
        "adaptive-icon.png",
        output_size=1024,
        r_frac=0.60,
        ring_frac=0.09,
        transparent_bg=True,
    )

    # splash-icon.png — centered mark on transparent (Expo puts washi bg behind it)
    make_and_save(
        "splash-icon.png",
        output_size=512,
        r_frac=0.76,
        ring_frac=0.09,
        transparent_bg=True,
    )

    # favicon.png — minimal 64×64 web icon
    make_favicon(output_size=64)

    print("\nDone! All assets saved to:", ASSETS_DIR)
