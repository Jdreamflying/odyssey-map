/**
 * ════════════════════════════════════════════════════════════════
 *  海面笔 —— 波纹刻线、海怪、帆船、古代注记
 * ════════════════════════════════════════════════════════════════
 *
 *  海面原来只有恒向线网和一层点刻，读起来是空的。铜版海图的海面从来
 *  不空：波纹刻线成群铺开，空白处点一两只海怪、几条帆船，海域名用
 *  疏排斜体压在上面。
 *
 *  关键约束：装饰只能落在**真正的水面**上。旧版是手写十个坐标点，
 *  换成高精度岸线之后可以直接做点在陆地内的判定，于是散布可以自动化，
 *  再也不会有海怪骑在西西里岛上。
 *
 *  海怪与帆船是手写的线稿 path（铜版风格：全轮廓线 + 单侧排线），
 *  不是 emoji、不是卡通剪影。
 */

import {
  wobble, toBezier, strokesToPath, curvesToPath, mulberry, valueNoise,
} from './pen.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (t, a = {}) => {
  const n = document.createElementNS(NS, t);
  for (const k in a) n.setAttribute(k, a[k]);
  return n;
};

/**
 * 「这个点是海吗」—— 用 bbox 预筛 + 点在环内测试。
 * 292 个环全测太慢，先按包围盒筛掉绝大多数。
 */
export function makeSeaTest(shapes) {
  const boxed = shapes.map((s) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of s.pts) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    return { pts: s.pts, x0, y0, x1, y1 };
  });

  return function isSea(x, y) {
    for (const b of boxed) {
      if (x < b.x0 || x > b.x1 || y < b.y0 || y > b.y1) continue;
      const pts = b.pts;
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) return false;
    }
    return true;
  };
}

/** 一个点周围 r 内是否全是同一种地面（海或陆）—— 大件装饰需要成片空白 */
export function clearArea(test, x, y, r) {
  if (!test(x, y)) return false;
  for (let a = 0; a < 8; a++) {
    const t = (a / 8) * Math.PI * 2;
    if (!test(x + Math.cos(t) * r, y + Math.sin(t) * r)) return false;
  }
  return true;
}

/**
 * 就近安置：先试给定点，不合格就螺旋向外找最近的合格点。
 * 硬编码坐标太脆 —— 岸线数据一更新、禁区一调整，装饰就会静默消失。
 * want 传 isSea 找海面，传 (x,y)=>!isSea(x,y) 找陆地。
 */
export function makeSpotFinder(isSea, blocked, want) {
  const test = want || isSea;
  return (x0, y0, need) => {
    if (!blocked(x0, y0) && clearArea(test, x0, y0, need)) return [x0, y0];
    for (let r = 6; r <= 48; r += 6) {
      for (let a = 0; a < 12; a++) {
        const t = (a / 12) * Math.PI * 2;
        const x = x0 + Math.cos(t) * r;
        const y = y0 + Math.sin(t) * r;
        if (!blocked(x, y) && clearArea(test, x, y, need)) return [x, y];
      }
    }
    return null;
  };
}

/** 一个点周围 r 内是否全是海 —— 大件装饰（海怪、船）需要成片水面 */
const clearWater = (isSea, x, y, r) => clearArea(isSea, x, y, r);

/* ── 波纹刻线 ─────────────────────────────────────────────────
   一簇 3–5 条平行的短波浪线，成群散布。 */
export function buildWaves(isSea, blocked, W, H) {
  const g = el('g', { class: 'sea__waves' });
  const rnd = mulberry(2939);
  const lines = [];

  /* 抖动网格散布：格心加随机偏移，比纯随机分布均匀，比规则网格自然 */
  const cell = 37;
  for (let gy = 0; gy * cell < H; gy++) {
    for (let gx = 0; gx * cell < W; gx++) {
      const x = (gx + 0.5) * cell + (rnd() - 0.5) * cell * 0.7;
      const y = (gy + 0.5) * cell + (rnd() - 0.5) * cell * 0.7;
      if (x < 8 || x > W - 8 || y < 8 || y > H - 8) continue;
      if (blocked(x, y)) continue;
      if (!clearWater(isSea, x, y, 13)) continue;
      if (rnd() < 0.18) continue;                 // 留些空白，别铺满

      const rows = 3 + Math.floor(rnd() * 3);
      const span = 9 + rnd() * 7;
      const gap = 2.6 + rnd() * 1.1;
      const tilt = (rnd() - 0.5) * 0.5;
      for (let r = 0; r < rows; r++) {
        const y0 = y + r * gap;
        const x0 = x - span / 2 + (r % 2) * 1.6;
        /* 一条 s 形短波：两个小拱 */
        const pts = [];
        const segs = 5;
        for (let k = 0; k <= segs; k++) {
          const u = k / segs;
          pts.push([
            x0 + u * span + tilt * u * 4,
            y0 + Math.sin(u * Math.PI * 2) * 0.85,
          ]);
        }
        lines.push(pts);
      }
    }
  }
  g.appendChild(el('path', { d: curvesToPath(lines, false, 1), class: 'sea__wave' }));
  return g;
}

/* ── 海怪 ─────────────────────────────────────────────────────
   奥劳斯·马格努斯式海蛇：两道拱出水面的身躯 + 抬起的头 + 背脊棘刺。
   全部为线稿，背光侧加排线，符合铜版画的表现方式。 */
function seaSerpent() {
  const g = el('g', { class: 'sea__beast' });
  /* 身躯：两个拱 */
  g.appendChild(el('path', {
    d: 'M-19 2 C-16.5 -3.4 -12.5 -3.6 -10.5 1.2 C-8.8 5.2 -5.4 5.4 -3.4 0.6 '
     + 'C-1.6 -3.8 2.2 -4.0 4.2 0.4',
    class: 'bst__ln',
  }));
  /* 颈与头 */
  g.appendChild(el('path', {
    d: 'M4.2 0.4 C6.0 4.2 9.2 4.6 10.6 1.0 C11.6 -1.6 11.2 -4.6 9.6 -6.6',
    class: 'bst__ln',
  }));
  g.appendChild(el('path', {
    d: 'M9.6 -6.6 C10.4 -8.6 12.6 -9.4 14.6 -8.6 L18.4 -10.2 L15.0 -7.2 '
     + 'C16.2 -6.0 16.0 -4.2 14.4 -3.6 C12.2 -2.8 10.0 -4.4 9.6 -6.6 Z',
    class: 'bst__ln bst__head',
  }));
  g.appendChild(el('circle', { cx: 13.2, cy: -7.4, r: 0.52, class: 'bst__eye' }));
  /* 背脊棘刺 */
  g.appendChild(el('path', {
    d: 'M-14.6 -2.6 l-0.7 -2.2 l1.7 1.4 M-12.2 -3.0 l-0.5 -2.4 l1.7 1.6 '
     + 'M-5.6 -2.4 l-0.7 -2.3 l1.8 1.4 M-3.0 -2.9 l-0.4 -2.4 l1.7 1.6 '
     + 'M6.8 -1.8 l-0.9 -2.1 l1.9 1.1',
    class: 'bst__spine',
  }));
  /* 背光侧排线 */
  g.appendChild(el('path', {
    d: 'M-17.4 1.6 l1.0 1.5 M-15.6 -0.4 l1.1 1.6 M-13.4 -1.2 l1.1 1.6 '
     + 'M-11.2 0.2 l1.1 1.6 M-9.0 2.6 l1.0 1.5 M-6.8 1.2 l1.1 1.6 '
     + 'M-4.6 -0.9 l1.1 1.6 M-2.2 -1.4 l1.1 1.6 M0.2 -0.6 l1.1 1.6 '
     + 'M2.6 1.4 l1.0 1.5 M5.2 2.4 l1.0 1.4 M8.0 3.0 l1.0 1.3',
    class: 'bst__hach',
  }));
  /* 水花 */
  g.appendChild(el('path', {
    d: 'M-21 3.4 q3 -1.6 6 0 M2 4.0 q3 -1.6 6 0 M9 4.6 q3.4 -1.6 6.8 0',
    class: 'bst__wash',
  }));
  return g;
}

/** 另一只：鲸/海豕，喷水柱，常见于 16 世纪海图 */
function seaWhale() {
  const g = el('g', { class: 'sea__beast' });
  g.appendChild(el('path', {
    d: 'M-13 1.4 C-11 -3.6 -3 -5.6 3.4 -3.6 C7.2 -2.4 9.6 -0.6 11.2 1.0 '
     + 'C8.6 1.0 7.0 1.8 6.2 3.2 C1.0 4.6 -8.4 4.4 -13 1.4 Z',
    class: 'bst__ln bst__head',
  }));
  /* 尾 */
  g.appendChild(el('path', {
    d: 'M11.2 1.0 C13.4 -1.2 15.4 -3.4 16.6 -5.6 C15.0 -3.0 14.6 -0.4 15.4 1.6 '
     + 'C16.6 0.2 18.0 -0.4 19.4 -0.2 C17.0 1.0 14.6 1.6 11.2 1.0 Z',
    class: 'bst__ln',
  }));
  g.appendChild(el('circle', { cx: -9.4, cy: -1.2, r: 0.5, class: 'bst__eye' }));
  /* 喷水柱 */
  g.appendChild(el('path', {
    d: 'M-6.6 -4.4 C-7.4 -8.0 -9.4 -9.6 -11.4 -10.4 M-6.6 -4.4 '
     + 'C-5.4 -8.2 -4.0 -10.0 -2.0 -11.0 M-6.6 -4.4 C-6.6 -8.0 -6.8 -9.8 -6.6 -11.2',
    class: 'bst__spout',
  }));
  /* 腹部排线 */
  g.appendChild(el('path', {
    d: 'M-10.4 2.0 l0.8 1.4 M-7.6 2.8 l0.8 1.4 M-4.6 3.4 l0.8 1.3 '
     + 'M-1.6 3.6 l0.8 1.3 M1.4 3.4 l0.8 1.3',
    class: 'bst__hach',
  }));
  g.appendChild(el('path', {
    d: 'M-16 3.0 q3.2 -1.6 6.4 0 M-2 4.6 q3.2 -1.6 6.4 0',
    class: 'bst__wash',
  }));
  return g;
}

/* ── 帆船 ─────────────────────────────────────────────────────
   16 世纪卡拉克帆船：高艉楼、方帆主桅、后桅三角帆、桅顶旗。 */
function carrack() {
  const g = el('g', { class: 'sea__ship' });
  /* 船体 */
  g.appendChild(el('path', {
    d: 'M-9.4 0 C-8.6 2.6 -5.0 4.0 -0.6 4.0 C3.4 4.0 6.6 3.0 8.0 0.8 '
     + 'L8.8 -2.0 L6.2 -1.0 L5.6 -2.6 L4.2 -0.8 L-6.2 -0.8 L-6.6 -2.8 L-9.4 0 Z',
    class: 'shp__ln shp__hull',
  }));
  /* 船体排线 */
  g.appendChild(el('path', {
    d: 'M-6.6 0.4 l0.7 2.2 M-4.4 0.6 l0.7 2.6 M-2.0 0.7 l0.6 2.8 '
     + 'M0.4 0.7 l0.6 2.8 M2.8 0.6 l0.6 2.6 M5.0 0.2 l0.7 2.2',
    class: 'shp__hach',
  }));
  /* 主桅与方帆 */
  g.appendChild(el('path', { d: 'M-1.0 -0.8 L-1.0 -12.4', class: 'shp__mast' }));
  g.appendChild(el('path', {
    d: 'M-5.4 -10.6 L3.4 -10.6 C2.6 -7.6 2.4 -6.0 3.0 -4.2 L-5.0 -4.2 '
     + 'C-4.4 -6.0 -4.6 -7.6 -5.4 -10.6 Z',
    class: 'shp__ln shp__sail',
  }));
  g.appendChild(el('path', {
    d: 'M-4.4 -9.6 L2.4 -9.6 M-4.0 -7.8 L2.1 -7.8 M-4.2 -6.0 L2.2 -6.0',
    class: 'shp__reef',
  }));
  /* 上层小帆 */
  g.appendChild(el('path', {
    d: 'M-3.0 -12.2 L1.2 -12.2 C0.8 -11.4 0.8 -11.6 1.0 -11.2 L-2.8 -11.2 Z',
    class: 'shp__ln shp__sail',
  }));
  /* 后桅三角帆 */
  g.appendChild(el('path', { d: 'M5.6 -2.6 L5.0 -8.4', class: 'shp__mast' }));
  g.appendChild(el('path', {
    d: 'M5.0 -8.2 L8.2 -2.4 L5.2 -2.6 Z', class: 'shp__ln shp__sail',
  }));
  /* 桅顶旗 */
  g.appendChild(el('path', {
    d: 'M-1.0 -12.4 L2.0 -13.4 L-1.0 -14.0 Z', class: 'shp__ln shp__flag',
  }));
  /* 船首斜桅 */
  g.appendChild(el('path', { d: 'M-6.4 -1.2 L-10.6 -3.6', class: 'shp__mast' }));
  /* 水线 */
  g.appendChild(el('path', {
    d: 'M-13 4.4 q3.4 -1.6 6.8 0 M-2 5.0 q3.4 -1.6 6.8 0',
    class: 'shp__wash',
  }));
  return g;
}

/**
 * 把海怪与帆船摆到成片的空水面上。
 * 候选位置写死为几处历史海图常用的空白海域，再用水面判定过滤 ——
 * 判定不过就跳过，绝不硬塞。
 */
export function buildMaritime(isSea, blocked, px, py, { skipShips = false, skipBeasts = false } = {}) {
  const g = el('g', { class: 'sea__maritime' });

  /* ⚠ 坐标要同时避开三样东西：陆地、装饰禁区（航线密集区与 Landmark
     主区，见 geographyDecorations 的 EXCLUSION_ZONES）、以及海域注记。
     上一版有三个位置正好落在禁区里被静默丢掉，最后海上只剩一怪一船。
     禁区大致是：爱琴海 19.5–27E/37.5–41N、墨西拿 13.5–16.5E/36.5–39.5N、
     第勒尼安 8–12.5E/39.5–43N、Landmark 背后 12–22E/34.5–37N。
     所以海怪与帆船一律安排在锡尔特湾、利比亚海、爱奥尼亚南部这些
     历史海图本来也爱留空的南部海域。 */
  /* ⚠ 坐标是量出来的，不是估的。
     必须同时避开四样东西：陆地、装饰禁区（航线密集区与 Landmark 主区，
     见 geographyDecorations 的 EXCLUSION_ZONES）、既有的罗盘/比例尺/
     海域名/站点，以及 **viewBox 的边界** —— 上一版把海蛇放在 31.5N、
     鲸放在 32.1N，而 viewBox 下边界是 32.2N，两只都画到了画面之外，
     最后海上只剩一怪一船。
     下面五处是在成图上扫格子量出来的空水面（各自可容半径 ≥26 单位）。 */
  /* ⚠ 尺寸按真实航海图的比例给：铜版海图上的海怪与帆船是**看得见的插图**，
     不是水印。之前 scale 0.8–1.1（船约 20 单位宽，占图宽 2%）在正常浏览
     尺寸下基本看不出是什么，等于白画。放大到 1.2–1.5 之后，
     船约 30 单位、海蛇约 50 单位，与 16 世纪海图上的比例相当。 */
  const cast = [
    { make: seaSerpent, lon: 24.92, la: 34.30, scale: 1.45, rot: -4, need: 24 },
    /* 西地中海那只：撒丁与突尼斯之间的空海。
       禁区 8–12.5E 只卡 39.5N 以北，37N 一带是空的。 */
    { make: seaWhale, lon: 9.6, la: 37.2, scale: 1.3, rot: 3, need: 20 },
    /* 第三只：亚得里亚南口，与前两只拉开距离 */
    { make: seaWhale, lon: 18.6, la: 41.0, scale: 1.0, rot: -5, need: 16 },
    { make: carrack, lon: 26.25, la: 36.73, scale: 1.35, rot: -3, need: 17 },
    { make: carrack, lon: 27.07, la: 33.67, scale: 1.2, rot: 5, need: 15 },
    { make: carrack, lon: 17.29, la: 42.33, scale: 1.25, rot: -6, need: 15 },
  ];

  /* 就近安置：先试给定坐标，不合格就螺旋向外找最近的合格点。
     硬编码坐标太脆 —— 岸线数据一更新、禁区一调整，装饰就会静默消失
     （上一版正是这样只剩一怪一船，而且完全没有提示）。
     实在找不到才跳过，并且一定要说出来。 */
  const debug = typeof window !== 'undefined' && window.location.search.includes('debug');

  const findSpot = makeSpotFinder(isSea, blocked);

  cast.forEach((c) => {
    /* 该类目已由外部美术资产接管就不再程序生成 */
    const isShip = c.make === carrack;
    if (isShip && skipShips) return;
    if (!isShip && skipBeasts) return;
    const x0 = px(c.lon);
    const y0 = py(c.la);
    const spot = findSpot(x0, y0, c.need);
    if (!spot) {
      if (debug) console.warn(`[seaPen] ${c.make.name} @${c.lon},${c.la} 附近找不到 ${c.need} 单位净水，跳过`);
      return;
    }
    const [x, y] = spot;
    if (debug && Math.hypot(x - x0, y - y0) > 1) {
      console.info(`[seaPen] ${c.make.name} 自 ${c.lon},${c.la} 就近挪了 ${Math.hypot(x - x0, y - y0).toFixed(0)} 单位`);
    }
    const node = c.make();
    node.setAttribute(
      'transform',
      `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${c.rot}) scale(${c.scale})`,
    );
    g.appendChild(node);
  });

  return g;
}

/* ── 注记 ──────────────────────────────────────────────────── */
export function buildAnnotations(seas, regions, px, py) {
  const g = el('g', { class: 'sea__names' });
  seas.forEach((s) => {
    const t = el('text', {
      x: px(s.lon).toFixed(1), y: py(s.la).toFixed(1),
      'font-size': s.size, 'letter-spacing': s.sp,
      'text-anchor': 'middle', class: 'cname cname--sea',
    });
    t.textContent = s.name;
    g.appendChild(t);
  });
  regions.forEach((s) => {
    const t = el('text', {
      x: px(s.lon).toFixed(1), y: py(s.la).toFixed(1),
      'font-size': s.size, 'letter-spacing': s.sp,
      'text-anchor': 'middle', class: 'cname cname--land',
    });
    t.textContent = s.name;
    g.appendChild(t);
  });
  return g;
}
