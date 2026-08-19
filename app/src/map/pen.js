/**
 * ════════════════════════════════════════════════════════════════
 *  刻笔 —— 手绘/铜版线条的几何原语
 * ════════════════════════════════════════════════════════════════
 *
 *  这一层不认识地理，只认识「点串」。它负责的是海图之所以像手绘的
 *  那些几何事实：
 *
 *    · 连续曲线      Catmull-Rom → 三次贝塞尔，不再是 M/L 折线
 *    · 手抖          沿法线的平滑噪声位移（烧进坐标，不用 SVG 滤镜）
 *    · 排线          沿弧长等距重采样 + 外法线，画真正垂直于岸的短线
 *    · 粗细不匀      同一条线用几个不同种子叠画，交叠处自然变粗
 *
 *  ⚠ 为什么手抖是烧进坐标、而不是 feDisplacementMap：
 *  海岸线换成高精度数据后有 7000+ 个顶点。给这么多顶点的图形套滤镜，
 *  每次重绘都要整层重新栅格化；而位移一旦烧进 path 的 d，渲染成本为零，
 *  而且刷新页面结果完全一致（种子固定），不会每次长得不一样。
 *
 *  所有函数都是纯函数，输入输出都是 SVG 用户坐标。
 */

/** 确定性伪随机 —— 同一个种子永远给同一张图 */
export function mulberry(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 一维值噪声：整数格点上取随机值，格点间做 smoothstep 插值。
 * 用它沿弧长驱动手抖 —— 相邻点的位移是连续的，所以线条是「抖」的，
 * 不是「毛」的。纯随机每点独立会得到锯齿毛边，那是噪点不是手绘。
 */
export function valueNoise(seed) {
  const rnd = mulberry(seed);
  const table = new Float64Array(1024);
  for (let i = 0; i < table.length; i++) table[i] = rnd() * 2 - 1;
  return function at(t) {
    const i = Math.floor(t);
    const f = t - i;
    const a = table[((i % 1024) + 1024) % 1024];
    const b = table[(((i + 1) % 1024) + 1024) % 1024];
    const s = f * f * (3 - 2 * f);
    return a + (b - a) * s;
  };
}

/** 投影一个 [经,纬] 环到 SVG 坐标 */
export const project = (ring, px, py) => ring.map((p) => [px(p[0]), py(p[1])]);

/** 闭合环的带符号面积（SVG 坐标系，y 向下） */
export function signedArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

/** 射线法点在多边形内 */
export function pointInRing(pt, pts) {
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** 折线总长 */
export function pathLength(pts, closed) {
  let L = 0;
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    L += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return L;
}

/**
 * 沿弧长等距重采样。排线必须等距 —— 直接用原始顶点会在数据密的地方
 * 挤成一团、稀的地方露出空白，一眼就是机器画的。
 */
export function resample(pts, step, closed) {
  if (pts.length < 2) return pts.slice();
  const out = [];
  let carry = 0;
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const seg = Math.hypot(dx, dy);
    if (seg < 1e-9) continue;
    let d = step - carry;
    while (d <= seg) {
      const t = d / seg;
      out.push([a[0] + dx * t, a[1] + dy * t]);
      d += step;
    }
    carry = seg - (d - step);
  }
  return out;
}

/**
 * 每点的外法线（单位向量）。用带符号面积定朝向，再用一次点在环内
 * 测试校正 —— 环的绕向在真实数据里两种都有，光靠面积符号会有一半反。
 */
export function outwardNormals(pts, closed = true) {
  const n = pts.length;
  const nor = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n];
    const b = pts[(i + 1) % n];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const L = Math.hypot(tx, ty) || 1;
    tx /= L; ty /= L;
    nor[i] = [ty, -tx];          // 右手法线，朝向待定
  }
  if (!closed) return nor;

  /* 取一个法线不退化的点，往法线方向挪一小步，若落在环内说明整体反了 */
  let flip = false;
  const probe = Math.floor(n / 3);
  for (let k = 0; k < n; k++) {
    const i = (probe + k) % n;
    const [nx, ny] = nor[i];
    if (!nx && !ny) continue;
    const t = [pts[i][0] + nx * 0.6, pts[i][1] + ny * 0.6];
    flip = pointInRing(t, pts);
    break;
  }
  if (flip) for (let i = 0; i < n; i++) nor[i] = [-nor[i][0], -nor[i][1]];
  return nor;
}

/**
 * 手抖：沿法线用值噪声位移。amp 是最大振幅（SVG 单位）。
 * scale 越小抖动越慢（长波），越大越急（短波）。
 */
export function wobble(pts, { amp = 0.35, scale = 0.16, seed = 1, closed = true } = {}) {
  const noise = valueNoise(seed);
  const nor = outwardNormals(pts, closed);
  let s = 0;
  return pts.map((p, i) => {
    if (i > 0) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    const d = noise(s * scale) * amp;
    return [p[0] + nor[i][0] * d, p[1] + nor[i][1] * d];
  });
}

/** 沿法线整体外扩/内缩 */
export function offsetAlongNormal(pts, dist, closed = true) {
  const nor = outwardNormals(pts, closed);
  return pts.map((p, i) => [p[0] + nor[i][0] * dist, p[1] + nor[i][1] * dist]);
}

const f = (n) => (Math.round(n * 10) / 10).toString();

/**
 * Catmull-Rom → 三次贝塞尔。这是「连续曲线」那一条要求的落点：
 * 输出的 d 只有 C，没有一段直线。
 */
export function toBezier(pts, closed = true, tension = 1) {
  const n = pts.length;
  if (n < 2) return '';
  if (n === 2) return `M${f(pts[0][0])} ${f(pts[0][1])}L${f(pts[1][0])} ${f(pts[1][1])}`;
  const at = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const k = tension / 6;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}

/** 一串独立短线压成一个 path 的 d —— 几千根排线只占一个 DOM 节点 */
export function strokesToPath(segs) {
  let d = '';
  for (const s of segs) {
    if (s.length < 2) continue;
    d += `M${f(s[0][0])} ${f(s[0][1])}`;
    for (let i = 1; i < s.length; i++) d += `L${f(s[i][0])} ${f(s[i][1])}`;
  }
  return d;
}

/** 把若干条折线各自转成贝塞尔，再拼成一个 d */
export function curvesToPath(lines, closed = false, tension = 1) {
  return lines.map((l) => toBezier(l, closed, tension)).join('');
}

/**
 * 转向角：正值 = 往外法线一侧转（岬角），负值 = 往陆地一侧转（海湾）。
 * 双线海岸只画在海湾段，这是识别海湾的依据。
 */
export function turning(pts, win = 3) {
  const n = pts.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = pts[(i - win + n) % n];
    const b = pts[i];
    const c = pts[(i + win) % n];
    const v1x = b[0] - a[0];
    const v1y = b[1] - a[1];
    const v2x = c[0] - b[0];
    const v2y = c[1] - b[1];
    const cross = v1x * v2y - v1y * v2x;
    const L = (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y)) || 1;
    out[i] = cross / L;
  }
  return out;
}

/** 取出满足条件的连续段（用来把海湾段切成若干条子路径） */
export function runsWhere(n, test, minLen = 4) {
  const runs = [];
  let start = -1;
  for (let i = 0; i <= n; i++) {
    const ok = i < n && test(i);
    if (ok && start < 0) start = i;
    else if (!ok && start >= 0) {
      if (i - start >= minLen) runs.push([start, i - 1]);
      start = -1;
    }
  }
  return runs;
}
