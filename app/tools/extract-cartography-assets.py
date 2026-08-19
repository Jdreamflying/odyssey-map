# -*- coding: utf-8 -*-
"""
从「地图小场景」的整版素材里切出单个图元。

输入：public/地图小场景/*.png —— 每张里排着好几个互不相连的元素，背景已经透明
输出：public/assets/cartography/<类目>/<名字>.png —— 每个图元一张，透明背景

做法：
  1. 用 alpha 通道做二值遮罩
  2. 缩到 1/4 再做膨胀，把同一个物体的分离小块（飞出去的旗、山脚的碎屿）连起来
  3. 连通域标记（纯 Python BFS，本机没有 scipy）
  4. 把每个连通域的包围盒映射回原分辨率，再用**原始 alpha** 收紧一次边界
  5. 裁剪、清掉边缘的红黄杂色、存成透明 PNG

⚠ 只做裁剪与去杂色，不重绘、不补线 —— 刻线一根不动。

用法：python tools/extract-cartography-assets.py [--dry]
"""
import os, sys
from collections import deque
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, 'public', '地图小场景')
OUT_ROOT = os.path.join(ROOT, 'public', 'assets', 'cartography')

DOWN = 4          # 标记时的缩小倍数
ALPHA_T = 32      # 判定"有内容"的 alpha 阈值
# 膨胀核（奇数，小图上）。这个值要按每张图的排布单独给：
# 山脉与海怪的元素之间隔得远、但自身有飞散的小块，需要大核把碎块并回主体；
# 船只与陆地是紧排的多个物体，核一大就会把相邻物体粘成一坨。
DILATE_DEFAULT = 7
MIN_AREA = 400    # 小图上的最小面积，滤掉碎点
PAD = 6           # 裁剪时四周留的空白（原图像素）
# 成图上这些图元最大也就 80–160 px 高（含 2× 高分屏），原素材却有 400–650 px。
# 留 2 倍余量就够，再大只是白白占带宽 —— 它们和影片的十二幕大图抢加载。
MAX_DIM = 520

DRY = '--dry' in sys.argv


def components(mask_small):
    """4 邻接连通域标记，返回 [(x0,y0,x1,y1,area,pixels), ...]

    pixels 是该连通域在小图上的坐标集合 —— 裁剪时要用它把邻居的碎片抹掉，
    否则矩形裁剪框会把旁边物体的边角一起带进来。"""
    w, h = mask_small.size
    px = mask_small.load()
    seen = bytearray(w * h)
    out = []
    for sy in range(h):
        for sx in range(w):
            if px[sx, sy] == 0 or seen[sy * w + sx]:
                continue
            q = deque([(sx, sy)])
            seen[sy * w + sx] = 1
            x0 = x1 = sx
            y0 = y1 = sy
            area = 0
            pixels = []
            while q:
                x, y = q.popleft()
                area += 1
                pixels.append((x, y))
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
                for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny*w+nx] and px[nx, ny]:
                        seen[ny*w+nx] = 1
                        q.append((nx, ny))
            if area >= MIN_AREA:
                out.append((x0, y0, x1, y1, area, pixels))
    return out


def tighten(im, box):
    """在给定范围内用原始 alpha 收紧包围盒"""
    x0, y0, x1, y1 = box
    region = im.crop((x0, y0, x1, y1))
    a = region.getchannel('A').point(lambda v: 255 if v >= ALPHA_T else 0)
    bbox = a.getbbox()
    if not bbox:
        return None
    return (x0 + bbox[0], y0 + bbox[1], x0 + bbox[2], y0 + bbox[3])


def declutter(im):
    """
    清掉边缘的红/黄杂色。
    这些是素材本身带的套印溢色，不是刻线的一部分：饱和度很高、色相偏红黄，
    而真正的刻线是低饱和的褐色。只把这类像素拉回中性褐，线条一根不动。
    """
    im = im.convert('RGBA')
    px = im.load()
    w, h = im.size
    fixed = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            mx, mn = max(r, g, b), min(r, g, b)
            if mx == 0:
                continue
            sat = (mx - mn) / mx
            # 高饱和 且 红或黄占主导 → 溢色
            if sat > 0.55 and r >= g >= b:
                lum = int(0.299 * r + 0.587 * g + 0.114 * b)
                # 拉回素材本身的褐调
                px[x, y] = (min(255, int(lum * 1.05)), int(lum * 0.92), int(lum * 0.78), a)
                fixed += 1
    return im, fixed


DILATE = {
    '4个山脉.png': 7,
    '海怪造型.png': 7,
    '船只造型.png': 3,     # 帆船/锚/罗盘/浪带挨得近，核大了会粘连
    '陆地造型.png': 3,     # 2×2 排布，同理
}

# 每个源文件 → (默认类目目录, [(名字, 类目覆盖or None), ...])
# 名字与类目都是看图判断的；顺序 = 先上后下、先左后右。
# 罗盘与锚归 navigation、浪带归 sea —— 它们跟帆船排在同一张原图上，
# 但按用途该分到别的类目去。
PLAN = {
    '4个山脉.png': ('mountains', [
        ('range-broad-ridge', None),      # 宽缓主脊，峰形圆钝
        ('range-jagged-peaks', None),     # 尖峭密峰，前缘带碎屿
        ('range-high-massif', None),      # 高耸块状山体，阴影最重
        ('range-plateau-scarp', None),    # 台地陡崖，顶面平，带棕榈
    ]),
    '船只造型.png': ('ships', [
        ('carrack-full-sail', None),         # 四桅卡拉克，满帆
        ('galley-oared', None),              # 地中海桨帆船，船首有眼 —— 最贴奥德修斯
        ('anchor', 'navigation'),            # 锚
        ('compass-rose', 'navigation'),      # 罗盘玫瑰
        ('wave-band', 'sea'),                # 波浪带
    ]),
    '海怪造型.png': ('sea', [
        ('sea-serpent-horned', None),     # 带角海蛇，长身盘曲
        ('whale-spouting', None),         # 喷水巨鲸
        ('sea-dragon-finned', None),      # 鳍背海龙，多棘
    ]),
    '陆地造型.png': ('settlements', [
        ('walled-city', None),            # 城墙环绕的山城
        ('temple-ruins', None),           # 神庙废墟（列柱 + 拱门）
        ('harbour-town', None),           # 港镇，带防波堤与泊船
        ('lighthouse-rock', None),        # 礁上灯塔
    ]),
}

total = 0
for fname, (cat, names) in PLAN.items():
    path = os.path.join(SRC_DIR, fname)
    if not os.path.exists(path):
        print(f'!! 找不到 {path}')
        continue
    im = Image.open(path).convert('RGBA')
    W, H = im.size

    mask = im.getchannel('A').point(lambda v: 255 if v >= ALPHA_T else 0)
    # ⚠ BOX 缩小是**求平均**，阈值给低了等于又膨胀了一圈：4×4 块里只要有
    #    一个半透明边缘像素，整块就被判为有内容，相邻物体就此粘连。
    #    要求块内覆盖率过半才算数。
    small = mask.resize((W // DOWN, H // DOWN), Image.BOX).point(lambda v: 255 if v > 128 else 0)
    dil = DILATE.get(fname, DILATE_DEFAULT)
    small = small.filter(ImageFilter.MaxFilter(dil))

    comps = components(small)
    # 先上后下、先左后右
    comps.sort(key=lambda c: (c[1] // 12, c[0]))
    print(f'\n{fname}: 检出 {len(comps)} 个独立对象（预期 {len(names)}）')


    for i, (x0, y0, x1, y1, area, pixels) in enumerate(comps):
        box = (max(0, x0*DOWN - dil*DOWN), max(0, y0*DOWN - dil*DOWN),
               min(W, (x1+1)*DOWN + dil*DOWN), min(H, (y1+1)*DOWN + dil*DOWN))
        tb = tighten(im, box)
        if not tb:
            continue
        tb = (max(0, tb[0]-PAD), max(0, tb[1]-PAD), min(W, tb[2]+PAD), min(H, tb[3]+PAD))

        # 只保留本连通域：把该域在小图上的像素放大回原尺寸做遮罩，
        # 再乘进 alpha。这样矩形框里混进来的邻居碎片会被抹掉。
        own = Image.new('L', small.size, 0)
        op = own.load()
        for (ox, oy) in pixels:
            op[ox, oy] = 255
        own = own.resize((W, H), Image.NEAREST).filter(ImageFilter.MaxFilter(3))
        crop = im.crop(tb)
        own_crop = own.crop(tb)
        a = crop.getchannel('A')
        crop.putalpha(Image.eval(Image.merge('L', [a]).point(lambda v: v), lambda v: v))
        crop = Image.composite(crop, Image.new('RGBA', crop.size, (0, 0, 0, 0)), own_crop)

        # 抹完再收一次紧，去掉遮罩留下的空边
        nb = crop.getchannel('A').point(lambda v: 255 if v >= ALPHA_T else 0).getbbox()
        if nb:
            crop = crop.crop(nb)
        if i < len(names):
            name, catOverride = names[i]
        else:
            name, catOverride = f'{cat}-{i+1:02d}', None
        outdir = os.path.join(OUT_ROOT, catOverride or cat)
        os.makedirs(outdir, exist_ok=True)
        crop, fixed = declutter(crop)
        # 限幅：长边超过 MAX_DIM 就等比缩小
        if max(crop.size) > MAX_DIM:
            r = MAX_DIM / max(crop.size)
            crop = crop.resize((max(1, round(crop.size[0]*r)), max(1, round(crop.size[1]*r))), Image.LANCZOS)
        w, h = crop.size
        print(f'  [{i}] {(catOverride or cat)+"/"+name:36s} {w}×{h}  比例 {w/h:.2f}')
        if not DRY:
            crop.save(os.path.join(outdir, f'{name}.png'), optimize=True)
            total += 1

print(f'\n共输出 {total} 张' + ('（dry run，未写盘）' if DRY else ''))
