/**
 * ════════════════════════════════════════════════════════════════
 *  资产层 —— 把外部美术资产摆到海图上
 * ════════════════════════════════════════════════════════════════
 *
 *  这一层**不生成任何图形**。它只做四件事：
 *    ① 读 src/data/cartographyAssets.js 的清单
 *    ② 把每条记录变成一个 <image>，按经纬度定位、按比例缩放、旋转、压淡
 *    ③ 探测图片真实长宽比，据此修正宽度（所以清单里不用手填 aspect）
 *    ④ debug 模式下校验：文件在不在、尺寸合不合古地图比例、
 *       有没有摆到海里 / 陆上 / 航线上
 *
 *  所有 <image> 一律 pointer-events:none —— 装饰绝不吃掉站点的点击。
 *
 *  层序上它夹在底图与航线之间：海岸线与地形在它下面，航线、站点、
 *  笔记本在它上面。于是资产永远不会盖住可交互的东西。
 */

import {
  CARTOGRAPHY_ASSETS, CATEGORIES, ASSET_ROOT, assetsOfType,
} from '../data/cartographyAssets.js';

const NS = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';
const el = (t, a = {}) => {
  const n = document.createElementNS(NS, t);
  for (const k in a) n.setAttribute(k, a[k]);
  return n;
};

const debugOn = () => typeof window !== 'undefined' && window.location.search.includes('debug');

/** 相对路径拼 BASE_URL；已经是绝对地址或 http 的原样放过 */
function resolveSrc(src) {
  if (!src) return '';
  if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) return src;
  const base = (typeof import.meta !== 'undefined' && import.meta.env)
    ? import.meta.env.BASE_URL : '/';
  return `${base}${ASSET_ROOT}${src}`;
}

/* 古地图比例参考，用于 debug 校验（单位：占地图高度的比例） */
const SIZE_HINT = {
  mountain: [0.03, 0.08],
  ship: [0.015, 0.05],
  sea: [0.025, 0.07],
  /* 大幅风景插图（城堡 / 港镇 / 灯塔）比城市小圆点大得多，
     历史地图上它们本来就是画出来给人看的，所以上限放宽 */
  settlement: [0.02, 0.08],
  navigation: [0.03, 0.13],
  wave: [0.02, 0.07],
  note: [0.015, 0.055],
};

/**
 * 建资产层。
 *
 * @param px,py     投影函数
 * @param W,H       地图 viewBox 尺寸
 * @param isSea     海面判定（可选，用于 debug 校验摆放）
 * @param routeHit  (box)=>命中航线的采样点数（可选，用于 debug 校验）
 */
export function buildAssetLayer(px, py, W, H, { isSea, routeHit } = {}) {
  const g = el('g', { class: 'carto-assets', 'aria-hidden': 'true' });
  const dbg = debugOn();

  if (!CARTOGRAPHY_ASSETS.length) {
    if (dbg) {
      console.info('[assetLayer] 资产清单为空，层已建好但没有内容 —— '
        + '把图放进 public/assets/cartography/ 并登记到 cartographyAssets.js 即可生效');
    }
    return g;
  }

  CARTOGRAPHY_ASSETS.forEach((a, i) => {
    const cat = CATEGORIES[a.type];
    if (!cat) {
      if (dbg) console.warn(`[assetLayer] "${a.name}" 的 type="${a.type}" 不在 CATEGORIES 里，跳过`);
      return;
    }

    /* 定位：优先经纬度 */
    const cx = Number.isFinite(a.lon) ? px(a.lon) : a.x;
    const cy = Number.isFinite(a.la) ? py(a.la) : a.y;
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
      if (dbg) console.warn(`[assetLayer] "${a.name}" 既没有 lon/la 也没有 x/y，跳过`);
      return;
    }

    const hFrac = a.scale ?? 0.04;
    const h = hFrac * H;
    /* 长宽比先假定 1.6，图片加载完再按真实比例改宽度 */
    const w0 = h * 1.6;

    const opacity = a.opacity ?? cat.defaultOpacity ?? 0.4;
    const rot = a.rotation ?? 0;
    const anchorBottom = a.anchor === 'bottom';

    const node = el('image', {
      class: `casset casset--${a.type}`,
      'data-name': a.name,
      width: w0.toFixed(1),
      height: h.toFixed(1),
      x: (cx - w0 / 2).toFixed(1),
      y: (anchorBottom ? cy - h : cy - h / 2).toFixed(1),
      opacity,
      preserveAspectRatio: 'xMidYMid meet',
    });
    if (a.blendMode) node.style.mixBlendMode = a.blendMode;
    const url = resolveSrc(a.src);
    node.setAttribute('href', url);
    node.setAttributeNS(XLINK, 'href', url);
    if (rot) {
      node.setAttribute('transform', `rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})`);
    }
    g.appendChild(node);

    /* 真实长宽比：探测一次，回来改宽度并重新居中。
       这样清单里不必手写 aspect，换图也不用改数字。 */
    const probe = new Image();
    probe.onload = () => {
      const ar = probe.naturalWidth / probe.naturalHeight;
      if (!Number.isFinite(ar) || ar <= 0) return;
      const w = h * ar;
      node.setAttribute('width', w.toFixed(1));
      node.setAttribute('x', (cx - w / 2).toFixed(1));
      if (dbg) checkPlacement(a, cx, cy, w, h, H, { isSea, routeHit, anchorBottom });
    };
    probe.onerror = () => {
      node.remove();
      if (dbg) console.warn(`[assetLayer] "${a.name}" 找不到文件：${url}（该条已跳过）`);
    };
    probe.src = url;
  });

  if (dbg) {
    const byType = Object.keys(CATEGORIES)
      .map((t) => `${t}×${assetsOfType(t).length}`).join(' ');
    console.info(`[assetLayer] 已登记 ${CARTOGRAPHY_ASSETS.length} 条资产 —— ${byType}`);
  }
  return g;
}

/** debug 校验：尺寸是否合古地图比例、有没有摆错地方 */
function checkPlacement(a, cx, cy, w, h, H, { isSea, routeHit, anchorBottom }) {
  const frac = h / H;
  const hint = SIZE_HINT[a.type];
  if (hint && (frac < hint[0] || frac > hint[1])) {
    console.warn(`[assetLayer] "${a.name}" 高度占图 ${(frac * 100).toFixed(1)}%，`
      + `${a.type} 的古地图常见区间是 ${hint[0] * 100}%–${hint[1] * 100}%`);
  }

  if (isSea) {
    const onSea = isSea(cx, cy);
    const wantSea = a.type === 'ship' || a.type === 'sea';
    const wantLand = a.type === 'mountain' || a.type === 'settlement';
    if (wantSea && !onSea) console.warn(`[assetLayer] "${a.name}" 是海上图元，却摆在陆地上`);
    if (wantLand && onSea) console.warn(`[assetLayer] "${a.name}" 是陆上图元，却摆在海里`);
  }

  if (routeHit) {
    const top = anchorBottom ? cy - h : cy - h / 2;
    const n = routeHit({ x0: cx - w / 2, x1: cx + w / 2, y0: top, y1: top + h });
    if (n > 0) console.warn(`[assetLayer] "${a.name}" 压住了航线（命中 ${n} 个采样点），建议挪开`);
  }
}
