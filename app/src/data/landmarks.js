import { ASSETS, assetUrl } from './cinema.js';

/**
 * ════════════════════════════════════════════════════════════════
 *  地点浮现插画 —— 被选中地点唤醒的档案水印
 * ════════════════════════════════════════════════════════════════
 *
 *  角色：**huge but ghostlike**。不是节点旁的小插图，而是一幅沉睡在
 *  纸里的巨大铜版画，被选中时缓缓浮现，再被地图线条与笔记本文字压住。
 *
 *  索引 i 严格对应 bootMap 的 S[] 十四站顺序：
 *    0 特洛伊   1 伊斯马罗斯   2 食莲人之地   3 独眼巨人洞   4 风神岛
 *    5 莱斯特律戈涅斯   6 埃埃亚岛(喀耳刻)   7 冥府入口   8 塞壬
 *    9 斯库拉与卡律布狄斯   10 特里纳基亚   11 俄古癸亚岛(卡吕普索)
 *    12 斯刻里亚   13 伊萨卡
 *
 *  ── preset ──────────────────────────────────────────────────
 *  每站一组独立参数，**不统一缩放**：插画的构图（宽横 / 方 / 高竖）、
 *  叙事分量、以及它在屏幕上要让开的东西各不相同。
 *
 *    scale     相对 stage 的缩放
 *    opacity   浮现峰值（还会再乘一次 CSS 里的 0.86）。
 *              本轮整组 ×1.05（透明度降低 5%），相对层级不变：
 *              斯库拉仍最淡、俄古癸亚仍最浓
 *    offsetX   横向位移，单位是 stage 宽度的百分比（正=向右，靠近笔记本）
 *    offsetY   纵向位移，单位是 stage 高度的百分比（正=向下）
 *    rotation  角度。只用 ±1° 以内 —— 图版压进装订好的图册时不可能
 *              和纸边完全平行，一点点歪才不像贴上去的 PNG
 *
 *  ── scale 的上限是算出来的，不是拍脑袋 ─────────────────────
 *  stage 是 94vh 高、再乘 CSS 的 scale(1.15)，即 108.1vh；宽度
 *  min(70vw,1280px) × 1.15，中心固定在 62vw。图片 object-fit: contain，
 *  于是渲染盒由图片长宽比决定：
 *
 *    高竖 / 方图（AR < 1.19）  高度撑满 → 108.1vh × scale
 *        要全部落在视口内：scale ≤ 0.90 − 0.02 × |offsetY|
 *
 *    宽横图（AR > 1.26）       宽度撑满 → 1.15 × min(70vw, 1280px) × scale
 *        右缘不出屏：          scale ≤ 0.845 − 24.8/视口宽 − 0.02 × offsetX
 *        最紧的是 901px 那一档（平板断点起点，舞台中心右移到 66vw）：
 *        算下来 0.818，所以宽横三张一律取 0.81
 *
 *  下面每一条都卡在各自上限之内 —— 这就是「所有 landmark 必须完整显示
 *  在视口范围内」这条规矩的实现方式。**改 scale 前先按上式验算。**
 *
 *  ── 为什么整体比上一版小 ────────────────────────────────────
 *  上一版方图 / 高竖图的 scale 在 0.94–1.12，渲染高度 108–121vh，
 *  上下各被切掉 40–140px。那道横切边正是「现代 PNG 贴纸」的观感来源。
 *  收进画面之后每张都完整，代价是绝对尺寸小了一档 —— 相对大小关系
 *  （谁最大、谁最淡）仍然按叙事分量拉开。
 */
export const LANDMARKS = [
  /* 宽横构图：靠宽度撑场面，不需要顶满高度 */
  { i: 0,  file: '00-troy.webp',           scale: 0.81, offsetX: 0,  offsetY: -3, rotation: -0.4, opacity: 0.194,
    note: '特洛伊城墙 · 宽横构图，仍是全组最宽的一张' },
  { i: 1,  file: '01-ismaros.webp',        scale: 0.81, offsetX: 0,  offsetY: -2, rotation: 0.5,  opacity: 0.205,
    note: '伊斯马罗斯 · 略宽' },

  { i: 2,  file: '02-lotophagi.webp',      scale: 0.86, offsetX: -1, offsetY: 2,  rotation: 0.4,  opacity: 0.226,
    note: '食莲人之地 · 低平沙岸，压低' },

  /* 用户点名：略显过大 → 缩一档；再压 10% 墨量。中心位置不动（offsetX 维持右偏一点点，
     和上一版 6 相比只回收到 4，仍在原来的构图带上） */
  { i: 3,  file: '03-cyclops.webp',        scale: 0.80, offsetX: 4,  offsetY: -1, rotation: -0.6, opacity: 0.142,
    note: '独眼巨人 · 全组最小的一张，洞窟满幅墨太重' },

  { i: 4,  file: '04-aeolia.webp',         scale: 0.86, offsetX: 1,  offsetY: 0,  rotation: 0.5,  opacity: 0.226,
    note: '风神岛' },

  /* 用户点名：保持巨大巨人主题（高竖图，全组最高），但墨量压到全组第二淡 */
  { i: 5,  file: '05-laestrygonians.webp', scale: 0.88, offsetX: 4,  offsetY: -1, rotation: 0,    opacity: 0.134,
    note: '莱斯特律戈涅斯巨人 · 高竖顶格，靠淡不靠小' },

  /* 用户点名：向右移动，让开地图中心 */
  { i: 6,  file: '06-circe.webp',          scale: 0.87, offsetX: 4,  offsetY: 0,  rotation: -0.5, opacity: 0.215,
    note: '喀耳刻 · 右移，避开中央航线丛' },

  /* 用户点名：降低不透明度 + 向右 */
  { i: 7,  file: '07-underworld.webp',     scale: 0.84, offsetX: 4,  offsetY: 1,  rotation: 0,    opacity: 0.121,
    note: '冥府 · 全组最淡，只留一团阴影' },

  /* 用户点名：略微缩小 + 向右 */
  { i: 8,  file: '08-sirens.webp',         scale: 0.83, offsetX: 1,  offsetY: -2, rotation: 0.6,  opacity: 0.215,
    note: '塞壬 · 缩一档并右移，不再压迫地图中心' },

  /* 用户点名：降低不透明度，只作为海峡危险标记 */
  { i: 9,  file: '09-scylla.webp',         scale: 0.86, offsetX: 4,  offsetY: 0,  rotation: 0,    opacity: 0.11,
    note: '斯库拉 · 巨大不规则，墨量必须最低' },

  /* 用户点名：向右移动，别遮住中央地图 */
  { i: 10, file: '10-thrinacia.webp',      scale: 0.81, offsetX: 0,  offsetY: 1,  rotation: 0.3,  opacity: 0.226,
    note: '太阳神牛群 · 宽横构图。offsetX 由 −2 提到 0、并收窄一档：'
        + '左缘从 440px 退到 587px，中央的西西里—爱奥尼亚一段完全让出来了' },

  /* 用户点名：整体向右，靠近右侧介绍区 */
  { i: 11, file: '11-ogygia.webp',         scale: 0.88, offsetX: 6,  offsetY: 0,  rotation: 0,    opacity: 0.247,
    note: '俄古癸亚与卡吕普索 · 高竖窄图，右移最多' },

  { i: 12, file: '12-scheria.webp',        scale: 0.86, offsetX: 2,  offsetY: -1, rotation: -0.4, opacity: 0.226,
    note: '斯刻里亚' },
  { i: 13, file: '13-ithaca.webp',         scale: 0.84, offsetX: 1,  offsetY: 3,  rotation: 0,    opacity: 0.2,
    note: '伊萨卡 · 横向铺开偏低' },
];

export const landmarkFor = (index) => {
  const l = LANDMARKS.find((x) => x.i === index);
  if (!l) return null;
  return { ...l, src: assetUrl(`${ASSETS.landmarkDir}${l.file}`) };
};
