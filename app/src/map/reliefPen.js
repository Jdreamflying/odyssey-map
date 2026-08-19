/**
 * ════════════════════════════════════════════════════════════════
 *  地形笔 —— 山脉排线、河流、港口符号
 * ════════════════════════════════════════════════════════════════
 *
 *  上一版的山是「糖块山」：沿脊线摆一串独立的小三角。放大看就是
 *  一排图标，这正是「现代地图 + 复古滤镜」的观感来源之一。
 *
 *  铜版地图的山不是图标，是**排线堆**（hachure relief）：
 *    · 一条连续的山脊墨线
 *    · 垂直于脊线的短排线，向两侧铺开
 *    · 受光侧（左上）排线短而疏，背光侧（右下）长而密
 *    · 山体宽度沿脊线起伏，两端收尖
 *    · 主脊之外挂几条支脉
 *
 *  于是山脉读起来是连绵的山体，而不是一串重复的小三角。
 */

import {
  project, resample, wobble, toBezier, strokesToPath, curvesToPath,
  valueNoise, mulberry, pathLength,
} from './pen.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (t, a = {}) => {
  const n = document.createElementNS(NS, t);
  for (const k in a) n.setAttribute(k, a[k]);
  return n;
};

/* 光自左上 —— 与影片和 landmark 的打光方向一致 */
const LIGHT = [-0.707, -0.707];

/**
 * 山脉排线。
 * @param ranges  [{ name, spine:[[经,纬]...], weight? }]
 */
/**
 * @param opts.namesOnly  只画山脉名，不画排线山体。
 *   山脉换成美术资产之后，排线山体要让位，但 APENNINVS / PINDVS / TAVRVS
 *   这些名字是**信息**不是装饰 —— 历史地图上山名一直都在，
 *   所以资产接管时仍然要把名字画出来。
 */
export function buildRelief(ranges, px, py, bounds, { namesOnly = false } = {}) {
  const g = el('g', { class: 'rlf' });

  const crestLines = [];
  const litStrokes = [];
  const shadeStrokes = [];
  const peakMarks = [];
  const labels = [];                 // { text, pts } —— 名字沿脊线排

  const wNoise = valueNoise(3313);
  const rnd = mulberry(6151);

  ranges.forEach((R, ri) => {
    const spine = project(R.spine, px, py);
    if (spine.length < 2) return;
    const total = pathLength(spine, false);
    if (total < 4) return;

    /* 脊线本身：先重采样成密点再手抖，得到一条连绵的山脊 */
    const dense = resample(spine, Math.min(2.2, total / 6), false);
    if (dense.length < 3) return;
    const crest = wobble(dense, { amp: 0.55, scale: 0.2, seed: 1471 + ri * 29, closed: false });
    crestLines.push(crest);
    if (R.label) labels.push({ text: R.labelText || R.name, pts: crest, key: `mtn-${ri}` });

    /* 沿脊线铺排线。
       ⚠ 与海岸排线同一个道理：步长要小、单根要短，成片才是山体。
       步长 1.5 时每根线都看得清，山脉读成一条毛毛虫；压到 0.85
       之后单根消失，只剩连绵的灰调 —— 那才是铜版地图的山。 */
    const step = 0.85;
    const samples = resample(crest, step, false);
    const n = samples.length;
    if (n < 3) return;

    const massif = (R.weight ?? 1);

    for (let i = 0; i < n; i++) {
      const a = samples[Math.max(0, i - 1)];
      const b = samples[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0];
      let ty = b[1] - a[1];
      const L = Math.hypot(tx, ty) || 1;
      tx /= L; ty /= L;
      /* 脊线的两侧法线 */
      let nx = ty;
      let ny = -tx;
      /* 让 n 指向背光侧（与光向反） */
      if (nx * LIGHT[0] + ny * LIGHT[1] > 0) { nx = -nx; ny = -ny; }

      /* 山体宽度：两端收尖（sin 包络）× 沿脊起伏 */
      const t = i / (n - 1);
      const envelope = Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** 0.55;
      const swell = 0.72 + (wNoise(i * 0.16 + ri * 13) * 0.5 + 0.5) * 0.8;
      const width = 3.4 * massif * envelope * swell;
      if (width < 0.4) continue;

      const [sx, sy] = samples[i];

      /* 背光侧：每个采样点都画，长度即山体宽度 */
      shadeStrokes.push([
        [sx, sy],
        [sx + nx * width + tx * 0.35, sy + ny * width + ty * 0.35],
      ]);
      /* 第二层从中段起，越靠外越短 —— 形成向山麓淡出的密度梯度 */
      if (i % 2 === 0) {
        shadeStrokes.push([
          [sx + nx * width * 0.45, sy + ny * width * 0.45],
          [sx + nx * width * 1.26, sy + ny * width * 1.26],
        ]);
      }

      /* 受光侧：短、疏 */
      if (i % 2 === 0) {
        const lw = width * 0.4;
        litStrokes.push([
          [sx, sy],
          [sx - nx * lw - tx * 0.22, sy - ny * lw - ty * 0.22],
        ]);
      }

      /* 主峰：在包络最高处附近点几个尖 */
      if (envelope > 0.86 && i % 16 === 0) {
        const h = width * 0.85;
        peakMarks.push([
          [sx - 1.5, sy + 0.4],
          [sx - 0.3, sy - h * 0.55],
          [sx + 1.2, sy + 0.5],
        ]);
      }
    }

    /* 支脉：从主脊中段斜挂出去，让山系有分叉而不是一根香肠 */
    const spurCount = Math.max(0, Math.round(total / 46));
    for (let s = 0; s < spurCount; s++) {
      const at = Math.floor((0.18 + 0.64 * ((s + 0.5) / spurCount)) * (n - 1));
      const base = samples[at];
      if (!base) continue;
      const a = samples[Math.max(0, at - 1)];
      const b = samples[Math.min(n - 1, at + 1)];
      let tx = b[0] - a[0];
      let ty = b[1] - a[1];
      const L = Math.hypot(tx, ty) || 1;
      tx /= L; ty /= L;
      let nx = ty;
      let ny = -tx;
      if (rnd() < 0.5) { nx = -nx; ny = -ny; }
      const len = 5 + rnd() * 7;
      const spur = [];
      for (let k = 0; k <= 4; k++) {
        const u = (k / 4) * len;
        spur.push([
          base[0] + nx * u + tx * (rnd() - 0.5) * 1.6,
          base[1] + ny * u + ty * (rnd() - 0.5) * 1.6,
        ]);
      }
      crestLines.push(spur);
      /* 支脉也要有影 */
      for (let k = 0; k < 4; k++) {
        const u = (k / 4) * len;
        const w = 2.1 * (1 - k / 5);
        shadeStrokes.push([
          [base[0] + nx * u, base[1] + ny * u],
          [base[0] + nx * u + ty * w * 0.4 - tx * w, base[1] + ny * u - tx * w * 0.4 - ty * w],
        ]);
      }
    }
  });

  if (!namesOnly) {
    g.appendChild(el('path', { d: strokesToPath(shadeStrokes), class: 'rlf__shade' }));
    g.appendChild(el('path', { d: strokesToPath(litStrokes), class: 'rlf__lit' }));
    g.appendChild(el('path', { d: curvesToPath(crestLines, false, 1), class: 'rlf__crest' }));
    g.appendChild(el('path', { d: strokesToPath(peakMarks), class: 'rlf__peak' }));
  }
  g.appendChild(buildRangeNames(labels, bounds));

  return g;
}

/**
 * 山脉名：沿脊线排，不是横平竖直摆一个词。
 * 历史地图上山名一律跟着山走 —— 这一条比字体本身更决定「像不像古图」。
 * 用 textPath 贴着脊线；脊线若自右向左，先反转，否则字会倒着排。
 */
const debugOn = () => typeof window !== 'undefined' && window.location.search.includes('debug');

const NAME_SIZE = 5.6;
const NAME_TRACK = 1.6;

function buildRangeNames(labels, bounds) {
  const g = el('g', { class: 'rlf__names' });
  if (!labels.length) return g;
  const defs = el('defs');
  g.appendChild(defs);

  labels.forEach((L) => {
    let pts = L.pts;

    /* ⚠ 先把标注基线裁到画面之内。
       山脊本身可以伸出 viewBox（阿尔卑斯、迪纳拉都伸到北边界之外，
       那是对的），但名字的排字基线如果落在画外，这个名字就白写了 ——
       实测迪纳拉的标注整段在 y<0、阿特拉斯整段在 x<0，两个词都没出现。
       取落在画内的最长一段来排字；连这段都不够长就干脆不标。 */
    if (bounds) {
      const inside = (p) => p[0] > bounds.pad && p[0] < bounds.W - bounds.pad
        && p[1] > bounds.pad && p[1] < bounds.H - bounds.pad;
      let best = [];
      let run = [];
      pts.forEach((p) => {
        if (inside(p)) { run.push(p); if (run.length > best.length) best = run; }
        else run = [];
      });
      if (best.length < 2) {
        if (debugOn()) console.warn(`[reliefPen] ${L.text} 的脊线不在画面内，跳过标注`);
        return;
      }
      pts = best;
    }

    if (pts[pts.length - 1][0] < pts[0][0]) pts = pts.slice().reverse();
    /* 名字压在脊线上会和排线打架，整体往受光侧（左上）挪一点 */
    let shifted = pts.map((p) => [p[0] - 1.6, p[1] - 2.6]);

    /* ⚠ textPath 的硬规矩：超出路径长度的字**不画**。
       奥林匹斯的脊线只有 15 单位，而 OLYMPVS 排开要 34 单位，
       于是整个词几乎一个字母都不显示（getBBox 还会返回一个满图的怪框）。
       所以短脊线要沿两端切线把标注路径延长到够用为止 ——
       延长的只是这条看不见的排字基线，山脊本身一点没动。 */
    const need = L.text.length * (NAME_SIZE * 0.62 + NAME_TRACK) * 1.15;
    let len = pathLength(shifted, false);
    if (len < need && shifted.length >= 2) {
      const grow = (need - len) / 2;
      const dirAt = (a, b) => {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const m = Math.hypot(dx, dy) || 1;
        return [dx / m, dy / m];
      };
      const head = dirAt(shifted[1], shifted[0]);
      const tail = dirAt(shifted[shifted.length - 2], shifted[shifted.length - 1]);
      shifted = [
        [shifted[0][0] + head[0] * grow, shifted[0][1] + head[1] * grow],
        ...shifted,
        [shifted[shifted.length - 1][0] + tail[0] * grow,
          shifted[shifted.length - 1][1] + tail[1] * grow],
      ];
      len = pathLength(shifted, false);
    }

    defs.appendChild(el('path', { id: L.key, d: toBezier(shifted, false, 1), fill: 'none' }));

    const t = el('text', {
      class: 'rlf__name', 'font-size': NAME_SIZE, 'letter-spacing': NAME_TRACK,
    });
    const tp = document.createElementNS(NS, 'textPath');
    tp.setAttribute('href', `#${L.key}`);
    tp.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${L.key}`);
    tp.setAttribute('startOffset', '50%');
    tp.setAttribute('text-anchor', 'middle');
    tp.textContent = L.text;
    t.appendChild(tp);
    g.appendChild(t);
  });
  return g;
}

/**
 * 河流：真实河道（来自 Natural Earth），自内陆向河口渐粗。
 * 渐粗用两条路径叠加实现 —— 全长一条细线，下游三分之一再叠一条稍粗的。
 */
export function buildRivers(lines, px, py) {
  const g = el('g', { class: 'rlf__rivers' });
  const thin = [];
  const thick = [];

  lines.forEach((R, i) => {
    const pts = project(R.pts ?? R, px, py);
    if (pts.length < 2) return;
    const w = wobble(pts, { amp: 0.4, scale: 0.22, seed: 811 + i * 17, closed: false });
    thin.push(w);
    /* 河口在数据里是首端还是末端不确定 —— 取更靠海（离陆地质心远）的一头
       会引入额外判断，这里简单取两端各三分之一里更长的一段叠粗，
       视觉上只要有渐变即可。 */
    const cut = Math.max(2, Math.floor(w.length * 0.38));
    thick.push(w.slice(0, cut));
  });

  g.appendChild(el('path', { d: curvesToPath(thin, false, 1), class: 'rlf__river' }));
  g.appendChild(el('path', { d: curvesToPath(thick, false, 1), class: 'rlf__river rlf__river--mouth' }));
  return g;
}

/**
 * 城市与港口符号。
 * 是不是港口不靠手工标注，而是量它到海岸线的距离 —— 换了高精度岸线之后
 * 这件事才做得准（旧的概化岸线连雅典都判在海里）。
 */
export function buildSettlements(cities, coastShapes, px, py, { portDist = 9 } = {}) {
  const g = el('g', { class: 'rlf__towns' });

  /* 把所有岸线顶点摊平成一张点表，用网格加速最近距离查询 */
  const cell = 12;
  const grid = new Map();
  const key = (gx, gy) => `${gx},${gy}`;
  coastShapes.forEach((s) => {
    s.pts.forEach(([x, y]) => {
      const k = key(Math.floor(x / cell), Math.floor(y / cell));
      let arr = grid.get(k);
      if (!arr) { arr = []; grid.set(k, arr); }
      arr.push([x, y]);
    });
  });
  const nearCoast = (x, y, r) => {
    const gx = Math.floor(x / cell);
    const gy = Math.floor(y / cell);
    const span = Math.ceil(r / cell);
    let best = Infinity;
    for (let i = -span; i <= span; i++) {
      for (let j = -span; j <= span; j++) {
        const arr = grid.get(key(gx + i, gy + j));
        if (!arr) continue;
        for (const [ax, ay] of arr) {
          const d = Math.hypot(ax - x, ay - y);
          if (d < best) best = d;
        }
      }
    }
    return best;
  };

  cities.forEach((c) => {
    const x = px(c.lon);
    const y = py(c.la);
    const d = nearCoast(x, y, portDist + 2);
    const isPort = d <= portDist;
    const sym = el('g', {
      class: `twn${isPort ? ' twn--port' : ''}`,
      transform: `translate(${x.toFixed(1)},${y.toFixed(1)})`,
    });

    if (isPort) {
      /* 港口：锚 —— 竖杆 + 横档 + 下端双钩 */
      sym.appendChild(el('path', {
        d: 'M0 -2.6 L0 2.2 M-1.5 -1.5 L1.5 -1.5 '
         + 'M-1.9 1.0 Q-1.5 2.6 0 2.4 Q1.5 2.6 1.9 1.0',
        class: 'twn__anchor',
      }));
      sym.appendChild(el('circle', { r: 0.55, cy: -3.1, class: 'twn__ring' }));
    } else {
      /* 内陆城：城墙 —— 一段矮墙加两座塔 */
      sym.appendChild(el('path', {
        d: 'M-2.4 1.6 L-2.4 -0.6 L-1.4 -0.6 L-1.4 -1.9 L-0.4 -1.9 L-0.4 -0.6 '
         + 'L1.4 -0.6 L1.4 -2.1 L2.4 -2.1 L2.4 1.6 Z',
        class: 'twn__wall',
      }));
    }
    g.appendChild(sym);

    const t = el('text', {
      x: (isPort ? 3.4 : 3.6).toFixed(1), y: '1.6',
      class: 'twn__name', 'font-size': 4.4,
    });
    t.textContent = c.name;
    sym.appendChild(t);
  });

  return g;
}
