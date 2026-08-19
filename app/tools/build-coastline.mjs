/**
 * ════════════════════════════════════════════════════════════════
 *  海岸线数据生成器 —— Natural Earth 1:10m → src/data/coastline.js
 * ════════════════════════════════════════════════════════════════
 *
 *  为什么需要这一步：
 *  地图原来的 COAST 是 18 个多边形、总共 245 个顶点的手写数组，纯 M/L 直线。
 *  平均每块陆地 13 个点 —— 亚得里亚海是一条斜线，爱琴海一个岛都没有。
 *  这种密度下无论叠多少排线、罗盘、海怪，读起来都还是「现代地图 + 复古滤镜」。
 *  真正的铜版海图之所以像手绘，第一位的原因是海岸线本身有连续高频曲率。
 *  所以先换数据，再谈绘制。
 *
 *  用法（需要网络，只在更新数据时跑）：
 *    node tools/build-coastline.mjs <放着 ne_*.geojson 的目录>
 *
 *  数据源：Natural Earth 1:10m（public domain）
 *    ne_10m_land / ne_10m_minor_islands / ne_10m_rivers_lake_centerlines
 *
 *  输出经纬度而不是投影后的 SVG 坐标 —— 投影常数改了数据不用重新生成。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.argv[2];
if (!SRC) {
  console.error('用法: node tools/build-coastline.mjs <ne geojson 目录>');
  process.exit(1);
}

/* 与 bootMap 的 PROJECTION 保持一致 —— 简化容差要按 SVG 用户单位算，
   否则高纬度会被过度简化。 */
const LON0 = 8.0, LAT1 = 43.0, COS = Math.cos((36.5 * Math.PI) / 180), K = 60;
const px = (lon) => (lon - LON0) * COS * K;
const py = (la) => (LAT1 - la) * K;

/* 裁剪框比 viewBox（经 8–28.5 / 纬 32.2–43）宽出一圈：
   裁剪产生的人工直边全部落在可视区之外，不会被看成海岸线。 */
const BOX = { w: 7.0, e: 30.0, s: 30.0, n: 45.0 };

/* ── Sutherland–Hodgman 矩形裁剪 ────────────────────────────────
   非洲/欧洲/亚洲是伸出画面的大陆块，必须裁剪并在框边闭合，
   否则整块大陆的巨大轮廓会把简化容差算歪。 */
function clipPoly(ring, box) {
  const edges = [
    { in: (p) => p[0] >= box.w, i: (a, b) => lerpX(a, b, box.w) },
    { in: (p) => p[0] <= box.e, i: (a, b) => lerpX(a, b, box.e) },
    { in: (p) => p[1] >= box.s, i: (a, b) => lerpY(a, b, box.s) },
    { in: (p) => p[1] <= box.n, i: (a, b) => lerpY(a, b, box.n) },
  ];
  let out = ring;
  for (const e of edges) {
    const src = out;
    out = [];
    for (let i = 0; i < src.length; i++) {
      const cur = src[i];
      const prev = src[(i + src.length - 1) % src.length];
      const curIn = e.in(cur);
      const prevIn = e.in(prev);
      if (curIn) {
        if (!prevIn) out.push(e.i(prev, cur));
        out.push(cur);
      } else if (prevIn) {
        out.push(e.i(prev, cur));
      }
    }
    if (!out.length) return [];
  }
  return out;
}
const lerpX = (a, b, x) => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])];
const lerpY = (a, b, y) => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y];

/** 折线裁剪（河流用）：落在框外的段直接断开，返回多条折线 */
function clipLine(pts, box) {
  const inside = (p) => p[0] >= box.w && p[0] <= box.e && p[1] >= box.s && p[1] <= box.n;
  const runs = [];
  let cur = [];
  for (const p of pts) {
    if (inside(p)) cur.push(p);
    else if (cur.length) { runs.push(cur); cur = []; }
  }
  if (cur.length) runs.push(cur);
  return runs.filter((r) => r.length > 1);
}

/* ── Douglas–Peucker，在投影后的 SVG 单位里做 ── */
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const P = pts.map((p) => [px(p[0]), py(p[1])]);
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let far = -1;
    let maxd = -1;
    const [ax, ay] = P[a];
    const [bx, by] = P[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [cx, cy] = P[i];
      let d;
      if (len2 === 0) {
        d = Math.hypot(cx - ax, cy - ay);
      } else {
        let t = ((cx - ax) * dx + (cy - ay) * dy) / len2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        d = Math.hypot(cx - (ax + t * dx), cy - (ay + t * dy));
      }
      if (d > maxd) { maxd = d; far = i; }
    }
    if (maxd > tol) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

/** 投影后的环面积（SVG 单位²）—— 用来筛掉肉眼看不见的礁石 */
function ringArea(ring) {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    s += px(a[0]) * py(b[1]) - px(b[0]) * py(a[1]);
  }
  return Math.abs(s) / 2;
}

const round = (n, d) => +n.toFixed(d);

/* ── 收集陆地环 ──────────────────────────────────────────────── */
function collectRings(fc) {
  const rings = [];
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates]
      : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const poly of polys) {
      // poly[0] 是外环，其余是洞（湖）。这张图不画内陆湖，只取外环。
      const outer = poly[0];
      if (!outer) continue;
      // 快速剔除：整环完全在框外
      let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      for (const p of outer) {
        if (p[0] < minx) minx = p[0];
        if (p[0] > maxx) maxx = p[0];
        if (p[1] < miny) miny = p[1];
        if (p[1] > maxy) maxy = p[1];
      }
      if (maxx < BOX.w || minx > BOX.e || maxy < BOX.s || miny > BOX.n) continue;
      rings.push(outer.map((p) => [p[0], p[1]]));
    }
  }
  return rings;
}

const land = JSON.parse(readFileSync(join(SRC, 'ne_10m_land.geojson'), 'utf8'));
const isles = JSON.parse(readFileSync(join(SRC, 'ne_10m_minor_islands.geojson'), 'utf8'));

const raw = [...collectRings(land), ...collectRings(isles)];
console.log(`框内候选环: ${raw.length}`);

/* 容差 0.30 SVG 单位 ≈ 989px 宽图上的 0.03% —— 保住海湾与半岛，
   同时把 10m 数据里肉眼无意义的抖动去掉。 */
const TOL = 0.3;
/* 面积下限 0.30 单位² ≈ 边长 0.55px 的方块。爱琴海的小岛必须留下，
   所以门槛压得很低；再小的礁石在 989px 宽度下不足一个像素。 */
const MIN_AREA = 0.3;

const out = [];
let dropped = 0;
for (const ring of raw) {
  const clipped = clipPoly(ring, BOX);
  if (clipped.length < 3) { dropped++; continue; }
  if (ringArea(clipped) < MIN_AREA) { dropped++; continue; }
  const s = simplify(clipped, TOL);
  if (s.length < 3) { dropped++; continue; }
  out.push(s.map((p) => [round(p[0], 3), round(p[1], 3)]));
}

/* 大块在前：绘制顺序决定墨线叠压关系，大陆先画，小岛压在上面 */
out.sort((a, b) => ringArea(b) - ringArea(a));

const totalPts = out.reduce((n, r) => n + r.length, 0);
console.log(`保留环: ${out.length}（丢弃 ${dropped}），顶点合计: ${totalPts}`);
console.log('前 12 大:', out.slice(0, 12).map((r) => r.length).join(', '));

/* ── 河流 ────────────────────────────────────────────────────── */
const riversFc = JSON.parse(readFileSync(join(SRC, 'ne_10m_rivers_lake_centerlines.geojson'), 'utf8'));
const WANT = /^(Nile|Danube|Po|Ebro|Rhone|Rhône|Tiber|Arno|Maritsa|Evros|Struma|Vardar|Axios|Adige|Tevere|Seyhan|Ceyhan|Menderes|Sakarya|Aliakmon|Pinios|Acheloos|Guadalquivir|Jucar|Segura|Medjerda)$/i;
const rivers = [];
for (const f of riversFc.features) {
  const name = f.properties?.name || f.properties?.name_en || '';
  const g = f.geometry;
  if (!g) continue;
  const lines = g.type === 'LineString' ? [g.coordinates]
    : g.type === 'MultiLineString' ? g.coordinates : [];
  const named = WANT.test(name.trim());
  for (const ln of lines) {
    for (const run of clipLine(ln.map((p) => [p[0], p[1]]), BOX)) {
      const s = simplify(run, 0.45);
      if (s.length < 2) continue;
      /* 名字对得上的一律收；其余只收够长的干流，避免变成现代水系图 */
      let len = 0;
      for (let i = 1; i < s.length; i++) {
        len += Math.hypot(px(s[i][0]) - px(s[i - 1][0]), py(s[i][1]) - py(s[i - 1][1]));
      }
      if (!named && len < 55) continue;
      if (len < 12) continue;
      rivers.push({ name: name.trim(), pts: s.map((p) => [round(p[0], 3), round(p[1], 3)]) });
    }
  }
}
rivers.sort((a, b) => b.pts.length - a.pts.length);
console.log(`河流: ${rivers.length} 段，顶点 ${rivers.reduce((n, r) => n + r.pts.length, 0)}`);

/* ── 写出 ────────────────────────────────────────────────────── */
const fmtRing = (r) => `[${r.map((p) => `[${p[0]},${p[1]}]`).join(',')}]`;

const banner = `/**
 * ════════════════════════════════════════════════════════════════
 *  高精度地中海海岸线 —— 由 tools/build-coastline.mjs 生成，请勿手改
 * ════════════════════════════════════════════════════════════════
 *
 *  来源：Natural Earth 1:10m（public domain）
 *    ne_10m_land + ne_10m_minor_islands + ne_10m_rivers_lake_centerlines
 *
 *  处理：裁剪到经 ${BOX.w}–${BOX.e} / 纬 ${BOX.s}–${BOX.n}（比 viewBox 宽一圈，
 *  裁剪产生的直边落在可视区外）→ Douglas–Peucker 简化，容差 ${TOL} SVG 单位
 *  → 剔除投影面积小于 ${MIN_AREA} 单位² 的礁石。
 *
 *  ${out.length} 个环 / ${totalPts} 个顶点。取代原来 18 环 / 245 顶点的手写 COAST，
 *  密度提升 ${(totalPts / 245).toFixed(1)} 倍 —— 这是「像手绘海图」的前提，
 *  排线、罗盘、海怪都建立在它之上。
 *
 *  坐标是 [经度, 纬度]，投影在 cartography.js 里做。
 */

/** 陆地外环，按投影面积从大到小 */
export const COASTLINE = [
`;

let js = banner;
js += out.map((r) => `  ${fmtRing(r)},`).join('\n');
js += `\n];\n\n/** 主要河流（干流，已按名字或长度筛过） */\nexport const RIVER_LINES = [\n`;
js += rivers.map((r) => `  { name: ${JSON.stringify(r.name)}, pts: ${fmtRing(r.pts)} },`).join('\n');
js += `\n];\n\nexport const COASTLINE_META = ${JSON.stringify({
  rings: out.length, points: totalPts, tolerance: TOL, minArea: MIN_AREA, box: BOX,
}, null, 2)};\n`;

const dest = 'src/data/coastline.js';
writeFileSync(dest, js, 'utf8');
console.log(`已写出 ${dest}  (${(js.length / 1024).toFixed(0)} KB)`);
