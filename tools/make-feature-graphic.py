"""스토어 그래픽 이미지(1024×500 · 알파 없음 · Play 등록정보).

코드로 그린다(AI 생성만으로 만들지 않는다 · common/GAME_ASSET_SOURCING.md §4).
«새벽 호수» 라이트 팔레트(theme/tokens.ts): bg 위에 번짐 3개 · 왼쪽 앱 아이콘(assets/brand/store-512.png) · 오른쪽 앱 이름.
글자는 앱 이름 한 줄만(언어마다 따로 만들 필요가 없게 · 글자 20% 이하). 🔴 아이콘이 자리표시라 이 그림도 자리표시다.

    python tools/make-feature-graphic.py   →   assets/brand/feature-1024x500.png
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1024, 500
BG = (246, 245, 251)
GLOWS = [((150, 40), 330, (230, 226, 252)), ((900, 260), 300, (218, 241, 233)), ((420, 520), 320, (240, 223, 243))]
TEXT = (30, 29, 69)
NAME = 'OneMoreThought'
FONT = 'C:/Windows/Fonts/NotoSansKR-VF.ttf'

img = Image.new('RGB', (W, H), BG)
glow = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(glow)
for (x, y), r, c in GLOWS:
    d.ellipse((x - r, y - r, x + r, y + r), fill=c)
img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(120)), 0.9)

# 아이콘: 둥근 사각(반경 22%) · 그림자 한 겹
size = 300
icon = Image.open(ROOT / 'assets/brand/store-512.png').convert('RGBA').resize((size, size), Image.LANCZOS)
mask = Image.new('L', (size, size), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, size, size), radius=int(size * 0.22), fill=255)
ix, iy = 110, (H - size) // 2
shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ImageDraw.Draw(shadow).rounded_rectangle((ix, iy + 18, ix + size, iy + size + 18), radius=int(size * 0.22), fill=(76, 64, 186, 70))
img = Image.alpha_composite(img.convert('RGBA'), shadow.filter(ImageFilter.GaussianBlur(22)))
img.paste(icon, (ix, iy), mask)

# 앱 이름: 굵게 · 폭에 맞춰 크기를 고른다
draw = ImageDraw.Draw(img)
font_size = 76
while True:
    font = ImageFont.truetype(FONT, font_size)
    try:
        font.set_variation_by_axes([800])
    except OSError:
        pass
    box = draw.textbbox((0, 0), NAME, font=font)
    if box[2] - box[0] <= W - (ix + size + 60) - 70 or font_size <= 40:
        break
    font_size -= 2
tx = ix + size + 60
ty = (H - (box[3] - box[1])) // 2 - box[1]
draw.text((tx, ty), NAME, font=font, fill=TEXT)

out = ROOT / 'assets/brand/feature-1024x500.png'
img.convert('RGB').save(out, optimize=True)
print(out, img.size)
