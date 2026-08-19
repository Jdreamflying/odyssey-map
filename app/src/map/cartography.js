/**
 * ════════════════════════════════════════════════════════════════
 *  古典制图层 V5 —— 高精度岸线 + 铜版刻线
 * ════════════════════════════════════════════════════════════════
 *
 *  V4 的问题不在装饰，在底层数据。当时的海岸线是 18 个环、245 个顶点的
 *  手写数组（平均每块陆地 13 个点），亚得里亚海是一条斜线、爱琴海一个岛
 *  都没有。在那种密度上无论叠多少罗盘、山符号、海怪，读起来都还是
 *  「现代地图 + 复古滤镜」。所以 V5 先换数据，再改绘制方式：
 *
 *    数据   src/data/coastline.js —— Natural Earth 1:10m
 *           292 环 / 7250 顶点（爱琴海 117 个岛、达尔马提亚 59 个）
 *           由 tools/build-coastline.mjs 生成
 *
 *    绘制   pen.js        线条原语（贝塞尔、手抖、法线、等距重采样）
 *           coastPen.js   岸线：主墨线×3 + 海侧排线×2 + 海湾双线 + 墨积
 *           reliefPen.js  山脉排线（连绵山体，不是糖块三角）、河流、港口
 *           seaPen.js     波纹刻线、海怪、帆船、注记
 *
 *  三个来源仍然是：
 *   ① 波特兰海图（15–17c）—— 隐形圆 + 圆周 16 朵风玫瑰的恒向线网
 *   ② 欧洲铜版地图（17–18c）—— 岸线排线、山地排线、单侧刻影
 *   ③ 古典地理文献 —— 只用确有记载的拉丁地名
 *
 *  ⚠ 站点坐标、航线、十四站数据、时间轴一律未动。本层只管「怎么画」。
 */

import { PROJECTION } from './bootMap.js';
import { COASTLINE, RIVER_LINES } from '../data/coastline.js';
import {
  CITIES, RANGES, SEAS, REGIONS, inExclusion,
} from '../data/geographyDecorations.js';
import { buildCoast } from './coastPen.js';
import { buildRelief, buildRivers, buildSettlements } from './reliefPen.js';
import {
  makeSeaTest, buildWaves, buildMaritime, buildAnnotations,
} from './seaPen.js';
import { buildMarginalia } from './marginalia.js';
import { layoutStationLabels, makeRouteHitTest } from './labelPen.js';
import { buildAssetLayer } from './assetLayer.js';
import { isCategoryTakenOver } from '../data/cartographyAssets.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (t, a = {}) => {
  const n = document.createElementNS(NS, t);
  for (const k in a) n.setAttribute(k, a[k]);
  return n;
};

export function applyCartography(svg) {
  if (!svg || svg.querySelector('.carto')) return;
  const PR = PROJECTION;
  if (!PR) return;                       // 投影未就绪则整层不画，绝不退回估算

  const t0 = performance.now();
  const { px, py, W, H, COS, K, LON0, LAT1 } = PR;

  /* 反投影 —— 装饰禁区是按经纬度定义的，散布判定在 SVG 坐标里做 */
  const unLon = (x) => x / (COS * K) + LON0;
  const unLa = (y) => LAT1 - y / K;
  const blocked = (x, y) => inExclusion(unLon(x), unLa(y));

  /* ── 类目接管开关 ────────────────────────────────────────
     某个类目一旦在 cartographyAssets.js 里登记了资产，它的程序生成版本
     就自动停画，避免资产和程序图叠成两层。清单现在是空的，所以下面
     全部为 false，地图维持现状。 */
  const takeover = {
    mountain: isCategoryTakenOver('mountain'),
    ship: isCategoryTakenOver('ship'),
    sea: isCategoryTakenOver('sea'),
    settlement: isCategoryTakenOver('settlement'),
    navigation: isCategoryTakenOver('navigation'),
    note: isCategoryTakenOver('note'),
    wave: isCategoryTakenOver('wave'),
  };

  const defs = svg.querySelector('defs') || svg.insertBefore(el('defs'), svg.firstChild);

  /* 海面点刻 */
  const stip = el('pattern', { id: 'seaStipple', width: 10, height: 10, patternUnits: 'userSpaceOnUse' });
  stip.appendChild(el('circle', { cx: 1.5, cy: 1.5, r: 0.32, fill: '#241a0d', opacity: 0.36 }));
  stip.appendChild(el('circle', { cx: 6.2, cy: 6.2, r: 0.28, fill: '#241a0d', opacity: 0.3 }));
  defs.appendChild(stip);

  /* ── 岸线先画：后面的水面判定、港口判定都要用它的几何 ── */
  const coast = buildCoast(COASTLINE, px, py);
  const isSea = makeSeaTest(coast.shapes);

  /* ── 底层：点刻 → 恒向线网 → 波纹 ─────────────────────────
     全部在陆地之下，于是半透明的陆地会把它们压淡，像纸上先画的底稿。 */
  const base = el('g', { class: 'carto', 'aria-hidden': 'true' });
  base.appendChild(el('rect', {
    x: 0, y: 0, width: W, height: H, fill: 'url(#seaStipple)', class: 'carto__stipple',
  }));
  base.appendChild(buildRhumb(W, H));
  if (!takeover.wave) base.appendChild(buildWaves(isSea, blocked, W, H));
  svg.insertBefore(base, svg.firstChild);

  /* ── 陆地：就地替换 bootMap 画的那 18 个 polygon ────────────
     替换而不是新加一层 —— 保住原来的 z 位置（经纬网之上、城市航线之下）。 */
  const oldLand = svg.querySelector('.land');
  const gLand = oldLand ? oldLand.parentNode : svg.appendChild(el('g'));
  gLand.replaceChildren();
  gLand.setAttribute('class', 'cartoland');
  gLand.appendChild(coast.group);
  /* 山脉换成资产之后仍然要保留山脉名 —— 名字是信息，不是装饰 */
  gLand.appendChild(buildRelief(RANGES, px, py, { W, H, pad: 6 },
    { namesOnly: takeover.mountain }));
  gLand.appendChild(buildRivers(RIVER_LINES, px, py));

  /* ── 上层：海怪帆船 → 聚落 → 注记 → 风玫瑰 ────────────────
     紧跟在陆地之后，仍然在 bootMap 的航线与站点之下。 */
  const top = el('g', { class: 'carto-top', 'aria-hidden': 'true' });
  top.appendChild(buildMaritime(isSea, blocked, px, py, {
    skipShips: takeover.ship, skipBeasts: takeover.sea,
  }));
  if (!takeover.settlement) top.appendChild(buildSettlements(CITIES, coast.shapes, px, py));
  top.appendChild(buildAnnotations(SEAS, REGIONS, px, py));
  /* 制图者手迹：小风向标、拉丁注记、修改痕迹、指示箭头 */
  top.appendChild(buildMarginalia(isSea, blocked, px, py, {
    skipRoses: takeover.navigation, skipNotes: takeover.note,
  }));
  /* 风玫瑰置于西地中海空海（真实坐标 10.6E / 38.4N 附近） */
  if (!takeover.navigation) top.appendChild(buildWindRose(px(10.6), py(38.4), Math.min(W, H) * 0.1));
  gLand.parentNode.insertBefore(top, gLand.nextSibling);

  /* ── 航线墨迹扩散 ────────────────────────────────────────
     航线本身（几何、分段、实虚线型、点击）全部是 bootMap 的，一律不动。
     这里只在它**下面**垫两层加粗压淡的克隆，做出蘸水笔在羊皮纸上
     洇开的一圈。克隆件 pointer-events:none、aria-hidden，不参与交互。 */
  addRouteBleed(svg);

  /* 航线命中测试建一次，站名排版与资产层校验共用 */
  const routeHit = makeRouteHitTest(svg);

  /* ── 美术资产层 ────────────────────────────────────────────
     层序上必须夹在**底图与航线之间**：山脉城堡帆船压在海岸线上，
     但航线、站点、笔记本压在它上面 —— 装饰永远不会盖住可交互的东西。
     carto-top 之后、bootMap 的城市与航线组之前，正好是这个位置。
     本层不生成任何图形，只摆 <image>；清单为空时它是个空组。 */
  top.parentNode.insertBefore(
    buildAssetLayer(px, py, W, H, { isSea, routeHit }),
    top.nextSibling,
  );

  /* ── 十四站站名重排 ────────────────────────────────────────
     必须放在最后：要等航线和节点都画完，才能按它们的实际位置避让。
     只改 <text> 的 x/y/text-anchor，节点与站点数据一个都不动。 */
  layoutStationLabels(svg, {
    W, H, routeHit,
    debug: typeof window !== 'undefined' && window.location.search.includes('debug'),
  });

  if (typeof window !== 'undefined' && window.location.search.includes('debug')) {
    const pts = COASTLINE.reduce((n, r) => n + r.length, 0);
    console.info(
      `[cartography] V5 绘制完成 ${(performance.now() - t0).toFixed(0)}ms —— `
      + `${COASTLINE.length} 环 / ${pts} 顶点`,
    );
  }
}

/**
 * 航线的墨迹扩散层。
 *
 * 现代地图的路线是一条均匀的纯色线，这正是「像 Google Map」的来源。
 * 蘸水笔画在羊皮纸上不是这样：墨会沿纤维洇开一圈，线本身也深浅不匀。
 *
 * 做法是克隆而不是重画 —— 航线的几何、分段、实虚线型全在 bootMap 手里，
 * 本层一个数都不碰，只是把它已经画好的结果复制两份垫在下面加粗压淡。
 * 于是 bootMap 以后怎么改航线，这层都自动跟着走。
 */
function addRouteBleed(svg) {
  const seg = svg.querySelector('.seg');
  const group = seg && seg.parentNode;
  if (!group || group === svg) return;
  if (svg.querySelector('.route-bleed')) return;

  /* ⚠ 这里**不能**用 feGaussianBlur。
     试过：给整个航线组套一层高斯模糊，滤镜区域覆盖大半张图，
     软件渲染下光是一次截图就能把渲染进程挂住不返回。地图刚因为
     绘制太重把影片拖垮过一次，不能再引入这种量级的开销。

     改用两层不同宽度的半透明描边叠加来近似洇开：
     宽而极淡的一层做外圈，窄而略深的一层做内圈，
     配上 stroke-linecap:round，视觉上就是墨在纸纤维里散开一圈。
     纯描边，没有栅格化开销。 */
  [
    { cls: 'route-bleed route-bleed--wide', order: 0 },
    { cls: 'route-bleed route-bleed--near', order: 1 },
  ].forEach((pass) => {
    const bleed = group.cloneNode(true);
    bleed.setAttribute('class', `${group.getAttribute('class') || ''} ${pass.cls}`.trim());
    bleed.setAttribute('aria-hidden', 'true');
    /* 克隆件里的 id 会与原件重复，直接清掉 —— 它只是一团墨，不需要被引用 */
    bleed.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    group.parentNode.insertBefore(bleed, group);
  });
}

/** 波特兰构造：隐形圆 + 圆周 16 朵风玫瑰，各射 32 线 */
function buildRhumb(W, H) {
  const g = el('g', { class: 'carto__rhumb' });
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) * 0.4;
  const reach = Math.hypot(W, H) * 0.6;

  g.appendChild(el('circle', { cx, cy, r: R, fill: 'none', class: 'carto__hidden-circle' }));

  for (let k = 0; k < 16; k++) {
    const a0 = (k * Math.PI * 2) / 16 - Math.PI / 2;
    const hx = cx + Math.cos(a0) * R;
    const hy = cy + Math.sin(a0) * R;
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI * 2) / 16;
      g.appendChild(el('line', {
        x1: hx.toFixed(1), y1: hy.toFixed(1),
        x2: (hx + Math.cos(a) * reach).toFixed(1), y2: (hy + Math.sin(a) * reach).toFixed(1),
        class: `rl rl--${i % 4 === 0 ? 'main' : 'half'}`,
      }));
    }
    for (let i = 0; i < 16; i++) {
      const a = ((i + 0.5) * Math.PI * 2) / 16;
      g.appendChild(el('line', {
        x1: hx.toFixed(1), y1: hy.toFixed(1),
        x2: (hx + Math.cos(a) * reach * 0.68).toFixed(1), y2: (hy + Math.sin(a) * reach * 0.68).toFixed(1),
        class: 'rl rl--quarter',
      }));
    }
    g.appendChild(el('circle', { cx: hx.toFixed(1), cy: hy.toFixed(1), r: 1.5, class: 'carto__nexus' }));
  }
  return g;
}

/** 欧式 32 向风玫瑰 */
function buildWindRose(cx, cy, r) {
  const g = el('g', { class: 'carto__rose', transform: `translate(${cx.toFixed(1)},${cy.toFixed(1)})` });
  g.appendChild(el('circle', { r: r * 0.99, class: 'rose__ring' }));
  g.appendChild(el('circle', { r: r * 0.82, class: 'rose__ring rose__ring--thin' }));
  g.appendChild(el('circle', { r: r * 0.3, class: 'rose__ring rose__ring--thin' }));

  for (let i = 0; i < 32; i++) {
    const a = (i * Math.PI * 2) / 32 - Math.PI / 2;
    const inner = i % 4 === 0 ? 0.82 : i % 2 === 0 ? 0.9 : 0.94;
    g.appendChild(el('line', {
      x1: (Math.cos(a) * r * inner).toFixed(1), y1: (Math.sin(a) * r * inner).toFixed(1),
      x2: (Math.cos(a) * r * 0.99).toFixed(1), y2: (Math.sin(a) * r * 0.99).toFixed(1),
      class: 'rose__tick',
    }));
  }
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8 - Math.PI / 2;
    const a1 = a - Math.PI / 32;
    const a2 = a + Math.PI / 32;
    const tip = [Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82];
    g.appendChild(el('path', {
      d: `M0 0 L${(Math.cos(a1) * r * 0.3).toFixed(1)} ${(Math.sin(a1) * r * 0.3).toFixed(1)} `
       + `L${tip[0].toFixed(1)} ${tip[1].toFixed(1)} Z`, class: 'rose__blade rose__blade--dark',
    }));
    g.appendChild(el('path', {
      d: `M0 0 L${(Math.cos(a2) * r * 0.3).toFixed(1)} ${(Math.sin(a2) * r * 0.3).toFixed(1)} `
       + `L${tip[0].toFixed(1)} ${tip[1].toFixed(1)} Z`, class: 'rose__blade rose__blade--light',
    }));
  }
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) * Math.PI * 2) / 8 - Math.PI / 2;
    const a1 = a - Math.PI / 48;
    const a2 = a + Math.PI / 48;
    const tip = [Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6];
    g.appendChild(el('path', {
      d: `M${(Math.cos(a1) * r * 0.2).toFixed(1)} ${(Math.sin(a1) * r * 0.2).toFixed(1)} `
       + `L${tip[0].toFixed(1)} ${tip[1].toFixed(1)} `
       + `L${(Math.cos(a2) * r * 0.2).toFixed(1)} ${(Math.sin(a2) * r * 0.2).toFixed(1)} Z`,
      class: 'rose__blade rose__blade--half',
    }));
  }
  const fy = -r * 0.86;
  g.appendChild(el('path', {
    d: `M0 ${(fy - r * 0.2).toFixed(1)} L${(r * 0.055).toFixed(1)} ${fy.toFixed(1)} `
     + `L0 ${(fy + r * 0.09).toFixed(1)} L${(-r * 0.055).toFixed(1)} ${fy.toFixed(1)} Z`,
    class: 'rose__fleur',
  }));
  return g;
}
