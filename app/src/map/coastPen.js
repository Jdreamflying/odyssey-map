/**
 * ════════════════════════════════════════════════════════════════
 *  海岸笔 —— 把高精度岸线画成铜版海图的岸线
 * ════════════════════════════════════════════════════════════════
 *
 *  现代地图画海岸：一条均匀的 stroke。铜版海图画海岸是四件事叠起来：
 *
 *    ① 主墨线      细，粗细不匀，有手抖
 *    ② 海侧排线    垂直于岸的短线，紧贴岸线，向外两三排后消失
 *    ③ 海湾双线    港湾与内凹段加一条内平行线（航海图标注可泊水域的习惯）
 *    ④ 墨积        转折处与岬角墨水积得多一点
 *
 *  粗细不匀的做法：同一条岸线用三个不同噪声种子各画一遍，宽度和透明度
 *  都不同。三条线大部分重合、局部分岔，交叠处自然变粗 —— 这是模拟
 *  雕版刀痕深浅最省的办法，SVG 的 stroke-width 本身是均匀的，做不到。
 *
 *  性能：所有环的所有子路径都拼进**一个** path 的 d。7000 多个顶点、
 *  几千根排线，最后只有十来个 DOM 节点。
 */

import {
  project, resample, outwardNormals, wobble, offsetAlongNormal,
  toBezier, strokesToPath, curvesToPath, turning, runsWhere,
  pathLength, valueNoise, mulberry,
} from './pen.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (t, a = {}) => {
  const n = document.createElementNS(NS, t);
  for (const k in a) n.setAttribute(k, a[k]);
  return n;
};

/* 小于这个周长的岛不画排线 —— 短线绕小岛一圈会变成放射状的「星芒」，
   比不画难看得多。爱琴海那一百多个小岛全靠这条门槛保住形状。 */
const HACHURE_MIN_PERIMETER = 42;
/* 小于这个周长的岛连双线也不画 */
const BAYLINE_MIN_PERIMETER = 150;

/**
 * @param rings   [[经,纬],...] 的数组，按面积从大到小
 * @param px,py   投影函数
 * @returns { fill, ink, hachure, bays }  —— 已经建好的 SVG 元素组
 */
export function buildCoast(rings, px, py) {
  const g = el('g', { class: 'coast' });

  /* 投影 + 预处理。每个环算一次法线与重采样，后面各层复用。 */
  const shapes = rings.map((ring, idx) => {
    const pts = project(ring, px, py);
    const per = pathLength(pts, true);
    return { pts, per, idx };
  });

  /* ── ① 陆地填充 ──────────────────────────────────────────
     用带手抖的曲线，填充边界与墨线才对得上。 */
  let fillD = '';
  const inked = shapes.map((s) => {
    const w = wobble(s.pts, { amp: s.per > 400 ? 0.34 : 0.2, scale: 0.13, seed: 1013 + s.idx * 7 });
    fillD += toBezier(w, true, 1);
    return { ...s, wob: w };
  });
  g.appendChild(el('path', { d: fillD, class: 'cst__land' }));

  /* ── ② 主墨线：三遍不同种子，做出粗细不匀 ────────────────── */
  const inkPasses = [
    { seed: 2207, amp: 0.30, cls: 'cst__ink cst__ink--a' },
    { seed: 5501, amp: 0.42, cls: 'cst__ink cst__ink--b' },
    { seed: 9109, amp: 0.22, cls: 'cst__ink cst__ink--c' },
  ];
  inkPasses.forEach((pass) => {
    let d = '';
    inked.forEach((s) => {
      /* 小岛只画一遍：三遍会把它涂黑，而且 200 多个小环各画三次
         纯属浪费 —— 卷起过程中这一层是要重新栅格化的。
         粗细不匀只在看得出粗细的大陆与大岛上才有意义。 */
      if (s.per < 40 && pass.seed !== 2207) return;
      const w = wobble(s.pts, { amp: pass.amp, scale: 0.17, seed: pass.seed + s.idx * 13 });
      d += toBezier(w, true, 1);
    });
    g.appendChild(el('path', { d, class: pass.cls }));
  });

  /* ── ③ 海侧排线 ───────────────────────────────────────────
     两排：内排密而长，外排疏而短，形成向海淡出的阴影带。 */
  /* ⚠ 排线要读成「调子」，不能读成「睫毛」。
     上一版是间距 2.6、长度 2.5–3.6 —— 又长又疏，每根都看得清，
     整条海岸线变成一排毛刺。铜版画的海岸阴影是**短而密**：
     单根线看不清，成片才形成向海淡出的灰调。
     间距 1.5 / 长度 1.4 左右，比例大致 1:1，这才是雕版的样子。 */
  const STEP = 1.5;
  const rank1 = [];
  const rank2 = [];
  const noiseLen = valueNoise(4241);
  inked.forEach((s) => {
    if (s.per < HACHURE_MIN_PERIMETER) return;
    const rs = resample(s.pts, STEP, true);
    if (rs.length < 4) return;
    const nor = outwardNormals(rs, true);
    /* 小岛的排线要按比例缩短，否则阴影带比岛本身还宽 */
    const sizeK = Math.max(0.5, Math.min(1, s.per / 260));
    let arc = 0;
    for (let i = 0; i < rs.length; i++) {
      if (i) arc += STEP;
      const [nx, ny] = nor[i];
      const [x, y] = rs[i];
      /* 长度随弧长起伏：刻工的手不是尺 */
      const jitter = noiseLen(arc * 0.07);
      const len = (1.35 + jitter * 0.45) * sizeK;
      /* 起点略微离岸，免得墨线被排线糊住 */
      const x0 = x + nx * 0.28;
      const y0 = y + ny * 0.28;
      rank1.push([[x0, y0], [x0 + nx * len, y0 + ny * len]]);

      /* 外排：隔一根画一根，从内排末端再往外一点，做出淡出的第二层 */
      if (i % 2 === 0 && s.per > 90) {
        const base = (1.95 + jitter * 0.3) * sizeK;
        const len2 = (0.85 + noiseLen(arc * 0.11 + 40) * 0.3) * sizeK;
        rank2.push([
          [x + nx * base, y + ny * base],
          [x + nx * (base + len2), y + ny * (base + len2)],
        ]);
      }
    }
  });
  g.appendChild(el('path', { d: strokesToPath(rank1), class: 'cst__hach cst__hach--in' }));
  g.appendChild(el('path', { d: strokesToPath(rank2), class: 'cst__hach cst__hach--out' }));

  /* ── ④ 海湾双线 ───────────────────────────────────────────
     只在向陆地一侧内凹、且够长的岸段画一条内平行线。 */
  const bayLines = [];
  inked.forEach((s) => {
    if (s.per < BAYLINE_MIN_PERIMETER) return;
    const rs = resample(s.pts, 2.2, true);
    if (rs.length < 24) return;
    const turn = turning(rs, 4);
    const inner = offsetAlongNormal(rs, -1.5, true);
    /* turn < 0 = 往陆侧转 = 海湾。阈值挑掉几乎直的岸段。 */
    runsWhere(rs.length, (i) => turn[i] < -0.22, 7).forEach(([a, b]) => {
      const seg = [];
      for (let i = a; i <= b; i++) seg.push(inner[i]);
      bayLines.push(seg);
    });
  });
  g.appendChild(el('path', { d: curvesToPath(bayLines, false, 1), class: 'cst__bay' }));

  /* ── ⑤ 墨积：岬角尖端点一小团 ─────────────────────────────
     铜版画里线条相交与急转处墨最重，加了之后线条才「活」。 */
  const blots = [];
  const rnd = mulberry(7717);
  inked.forEach((s) => {
    if (s.per < 60) return;
    const rs = resample(s.pts, 3.0, true);
    const turn = turning(rs, 3);
    for (let i = 0; i < rs.length; i++) {
      if (turn[i] > 0.5 && rnd() < 0.5) {
        blots.push([rs[i][0], rs[i][1], 0.34 + rnd() * 0.3]);
      }
    }
  });
  const blotG = el('g', { class: 'cst__blot' });
  blots.forEach(([x, y, r]) => blotG.appendChild(el('circle', {
    cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(2),
  })));
  g.appendChild(blotG);

  return { group: g, shapes: inked, fillD };
}

/**
 * 陆地并集，供遮罩使用（内陆排线要被限制在陆地内）。
 * 单独给一份不带手抖的干净几何 —— 遮罩边缘抖动会漏出锯齿。
 */
export function buildLandUnionPath(rings, px, py) {
  let d = '';
  rings.forEach((ring) => { d += toBezier(project(ring, px, py), true, 1); });
  return d;
}
