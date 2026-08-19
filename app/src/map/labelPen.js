/**
 * ════════════════════════════════════════════════════════════════
 *  标签笔 —— 十四站站名的排布与引线
 * ════════════════════════════════════════════════════════════════
 *
 *  bootMap 给每一站配了一个固定方位（数据里的 lp：e/w/n/s/ne/nw/se/sw），
 *  按 LOFF 表偏移 14 单位把站名摆在节点旁边。站点稀疏时没问题，但
 *  「莱斯特律戈涅斯」和「埃埃亚岛」两站相距不到 20 单位，两个名字直接叠在
 *  一起；风神岛、斯库拉一带也彼此挨得很近。
 *
 *  处理方式是历史地图的做法，不是「把字缩小」：
 *    · 节点一个都不动（坐标是证据，不能为了排版挪）
 *    · 站名在节点周围八个方位 × 三档半径里挑一个不打架的位置
 *    · 一旦挪得比原位远，就补一条细引线把名字牵回节点
 *
 *  打分时避开：别的站名、所有节点圆盘、航线本身、画面边界。
 *  站名压在航线上是最难读的一种，所以航线按弧长采样后逐点计罚。
 *
 *  ⚠ 只改 <text> 的 x / y / text-anchor 三个呈现属性，
 *  站点数据、航线数据、节点位置一律不碰。
 */

const NS = 'http://www.w3.org/2000/svg';
const el = (t, a = {}) => {
  const n = document.createElementNS(NS, t);
  for (const k in a) n.setAttribute(k, a[k]);
  return n;
};

/* 八方位，与 bootMap 的 LOFF 同构；[单位向量, text-anchor] */
const DIRS = [
  { k: 'e', ux: 1, uy: 0.28, an: 'start' },
  { k: 'ne', ux: 0.8, uy: -0.6, an: 'start' },
  { k: 'n', ux: 0, uy: -1, an: 'middle' },
  { k: 'nw', ux: -0.8, uy: -0.6, an: 'end' },
  { k: 'w', ux: -1, uy: 0.28, an: 'end' },
  { k: 'sw', ux: -0.8, uy: 0.95, an: 'end' },
  { k: 's', ux: 0, uy: 1.25, an: 'middle' },
  { k: 'se', ux: 0.8, uy: 0.95, an: 'start' },
];
const RADII = [15, 25, 36];
const NODE_R = 13;          // 节点圆盘半径（ring 10 / halo 10.5，留一点余量）

const overlap = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0))
  * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

/** 把航线按弧长采样成点集，用来判断「站名压没压到航线」 */
function sampleRoutes(svg, step = 7) {
  const pts = [];
  svg.querySelectorAll('.seg, .trail').forEach((p) => {
    if (p.closest('.route-bleed')) return;          // 墨迹克隆件不参与
    let len = 0;
    try { len = p.getTotalLength(); } catch { return; }
    if (!len || !Number.isFinite(len)) return;
    for (let d = 0; d <= len; d += step) {
      try {
        const q = p.getPointAtLength(d);
        pts.push([q.x, q.y]);
      } catch { break; }
    }
  });
  return pts;
}

/**
 * 建一个「这个方框压到航线了吗」的测试函数。
 * 站名排版和资产层都要用它，所以单独导出，避免各采样一次。
 */
export function makeRouteHitTest(svg, step = 14, CELL = 24) {
  const grid = new Map();
  sampleRoutes(svg, step).forEach(([rx, ry]) => {
    const k = `${Math.floor(rx / CELL)},${Math.floor(ry / CELL)}`;
    let arr = grid.get(k);
    if (!arr) { arr = []; grid.set(k, arr); }
    arr.push([rx, ry]);
  });
  return (box) => {
    let n = 0;
    for (let gx = Math.floor(box.x0 / CELL); gx <= Math.floor(box.x1 / CELL); gx++) {
      for (let gy = Math.floor(box.y0 / CELL); gy <= Math.floor(box.y1 / CELL); gy++) {
        const arr = grid.get(`${gx},${gy}`);
        if (!arr) continue;
        for (const [rx, ry] of arr) {
          if (rx > box.x0 && rx < box.x1 && ry > box.y0 && ry < box.y1) n += 1;
        }
      }
    }
    return n;
  };
}

export function layoutStationLabels(svg, { W, H, debug = false, routeHit } = {}) {
  /* ⚠ 排除航线墨迹层里的克隆节点。addRouteBleed 把整个航线组复制了两份，
     里面连 .node 一起复制了（CSS 把它们 display:none 掉）。不排除的话
     这里会拿到 14 + 28 = 42 个「节点」，对着一堆看不见的副本排版。 */
  const nodes = Array.from(svg.querySelectorAll('.node'))
    .filter((n) => !n.closest('.route-bleed'));
  if (!nodes.length) return;

  /* 节点圆心（来自 g 的 translate，不做任何修改） */
  const info = nodes.map((g) => {
    const tr = g.getAttribute('transform') || '';
    const a = tr.indexOf('translate(');
    let cx = 0;
    let cy = 0;
    if (a >= 0) {
      const nums = tr.slice(a + 10, tr.indexOf(')', a)).split(',');
      cx = parseFloat(nums[0]);
      cy = parseFloat(nums[1]);
    }
    const lbl = g.querySelector('.lbl');
    /* bootMap 按数据里的 lp 给了一个人工挑过的方位。它多数时候是对的，
       只有真撞上了才该推翻，所以把原值记下来，在打分时给它一点优待。 */
    const od = lbl ? {
      dx: parseFloat(lbl.getAttribute('x') || 0),
      dy: parseFloat(lbl.getAttribute('y') || 0),
      an: lbl.getAttribute('text-anchor') || 'start',
    } : null;
    return { g, lbl, cx, cy, od };
  }).filter((n) => n.lbl && Number.isFinite(n.cx));

  /* 文字尺寸只量一次 —— 换位置不改变宽高 */
  info.forEach((n) => {
    let b;
    try { b = n.lbl.getBBox(); } catch { b = null; }
    n.w = b ? b.width : 40;
    n.h = b ? b.height : 12;
    /* 基线到 bbox 顶的距离，用来由 y 反推方框 */
    n.topOff = b ? b.y - parseFloat(n.lbl.getAttribute('y') || 0) : -n.h * 0.8;
  });

  /* 航线命中测试：外面已经建好就复用，避免把航线重新采样一遍 */
  const routeHits = routeHit || makeRouteHitTest(svg);
  const discs = info.map((n) => ({ cx: n.cx, cy: n.cy }));
  const placed = [];
  let moved = 0;

  const boxFor = (n, dx, dy, an) => {
    const left = an === 'start' ? dx : an === 'middle' ? dx - n.w / 2 : dx - n.w;
    return {
      x0: n.cx + left, x1: n.cx + left + n.w,
      y0: n.cy + dy + n.topOff, y1: n.cy + dy + n.topOff + n.h,
    };
  };

  info.forEach((n) => {
    let best = null;
    RADII.forEach((r, ri) => {
      DIRS.forEach((d) => {
        const dx = d.ux * r;
        const dy = d.uy * r * 0.62 + (d.uy > 0 ? 4 : 0);
        const box = boxFor(n, dx, dy, d.an);

        /* 画面外直接淘汰 */
        if (box.x0 < 2 || box.x1 > W - 2 || box.y0 < 2 || box.y1 > H - 2) return;

        let pen = ri * 26;                              // 越远越不划算
        placed.forEach((p) => { pen += overlap(box, p) * 3; });
        discs.forEach((c) => {
          const near = {
            x0: c.cx - NODE_R, x1: c.cx + NODE_R, y0: c.cy - NODE_R, y1: c.cy + NODE_R,
          };
          pen += overlap(box, near) * 4;
        });
        pen += routeHits(box) * 1.1;
        /* 与数据里人工挑的方位一致就减免一点，平局时优先保留原样 */
        if (n.od && d.an === n.od.an && Math.abs(dx - n.od.dx) < 9 && Math.abs(dy - n.od.dy) < 9) {
          pen -= 14;
        }
        if (!best || pen < best.pen) best = { pen, dx, dy, an: d.an, box, r };
      });
    });

    if (!best) return;
    n.lbl.setAttribute('x', best.dx.toFixed(1));
    n.lbl.setAttribute('y', best.dy.toFixed(1));
    n.lbl.setAttribute('text-anchor', best.an);
    placed.push(best.box);

    /* 挪得比最近一档远，就补一条引线，把名字牵回节点 */
    if (best.r > RADII[0]) {
      moved += 1;
      const bx = Math.max(best.box.x0, Math.min(n.cx, best.box.x1));
      const by = Math.max(best.box.y0, Math.min(n.cy, best.box.y1));
      const tx = bx - n.cx;
      const ty = by - n.cy;
      const m = Math.hypot(tx, ty) || 1;
      const sx = (tx / m) * (NODE_R - 1.5);
      const sy = (ty / m) * (NODE_R - 1.5);
      const ex = tx - (tx / m) * 1.6;
      const ey = ty - (ty / m) * 1.6;
      const leader = el('path', {
        class: 'lbl-leader',
        d: `M${sx.toFixed(1)} ${sy.toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}`,
      });
      /* 放在 g 的最前面：压在圆盘之下，且跟随 .node 的 dim/unlit 一起变淡 */
      n.g.insertBefore(leader, n.g.firstChild);
    }
  });

  if (debug) {
    /* 复查一遍还剩多少互相重叠 */
    let clashes = 0;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) if (overlap(placed[i], placed[j]) > 1) clashes += 1;
    }
    console.info(`[labelPen] ${info.length} 个站名重排完成，${moved} 个带引线，剩余互相重叠 ${clashes} 对`);
  }
}
