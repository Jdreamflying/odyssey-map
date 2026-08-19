/**
 * ════════════════════════════════════════════════════════════════
 *  转场语法 —— 不同段落用不同的进出方式
 * ════════════════════════════════════════════════════════════════
 *
 *  上一版全篇只有淡入淡出 + 横移 + 缩放，像高级 PPT。
 *  本版按四个段落各给一套语法：
 *
 *    战争段  尘土擦拭、长矛林立起、烟雾吞没
 *    海上段  海浪 wipe、船帆掠过遮挡
 *    神话段  洞口收拢、浪峰遮挡、极慢现形、整体下沉、岩壁挤压
 *    归乡段  晨雾显形、水面平静
 *
 *  每一式返回 { from, to }，作用在幕的 inner 层（clipPath / filter /
 *  transform），root 层只管 opacity 与整幕位移，两者互不干扰。
 *
 *  注意：clipPath 只能在同形状函数之间插值（inset↔inset、
 *  polygon↔polygon 且顶点数相同、circle↔circle），下面已保证。
 */

const FULL_INSET = 'inset(0% 0% 0% 0%)';
const FULL_POLY = 'polygon(-30% 0%, 130% 0%, 130% 100%, -30% 100%)';

/* ── 进入 ───────────────────────────────────────────────────── */
export const ENTERS = {
  /** 尘土擦拭：从一片扬尘里显影 */
  dust: {
    from: { autoAlpha: 0, scale: 1.06, filter: 'blur(13px) contrast(0.86) brightness(1.12)' },
    to:   { autoAlpha: 1, scale: 1,    filter: 'blur(0px) contrast(1) brightness(1)' },
  },

  /** 长矛林由远而近立起：自下缘向上展开，同时推近 */
  spearRise: {
    from: { autoAlpha: 0, clipPath: 'inset(62% 0% 0% 0%)', y: 46, scale: 1.1, filter: 'blur(9px)' },
    to:   { autoAlpha: 1, clipPath: FULL_INSET,            y: 0,  scale: 1,   filter: 'blur(0px)' },
  },

  /** 船帆掠过：一道斜向的遮挡自左扫开 */
  sailWipe: {
    from: { autoAlpha: 1, clipPath: 'polygon(-30% 0%, -6% 0%, -30% 100%, -30% 100%)' },
    to:   { autoAlpha: 1, clipPath: FULL_POLY },
  },

  /** 海浪 wipe：浪自左下斜向推开画面 */
  waveWipe: {
    from: { autoAlpha: 1, clipPath: 'polygon(-30% 100%, -30% 100%, -12% 100%, -30% 100%)', filter: 'blur(6px)' },
    to:   { autoAlpha: 1, clipPath: FULL_POLY, filter: 'blur(0px)' },
  },

  /** 洞口张开：自独眼的位置向外撑开。
   *  filter 必须显式写成 brightness(1) —— 若留空，退出时 GSAP 会把
   *  `none` 当作 0 基线，brightness 从 0 起算，画面先黑一下再亮回来。 */
  caveOpen: {
    from: { autoAlpha: 1, clipPath: 'circle(9% at 54% 16%)', scale: 1.12, filter: 'brightness(1.08)' },
    to:   { autoAlpha: 1, clipPath: 'circle(150% at 54% 16%)', scale: 1, filter: 'brightness(1)' },
  },

  /** 极慢现形：几乎只有 opacity，重在静止 */
  slowForm: {
    from: { autoAlpha: 0, scale: 1.012, filter: 'blur(7px) brightness(1.06)' },
    to:   { autoAlpha: 1, scale: 1,     filter: 'blur(0px) brightness(1)' },
  },

  /** 岩壁挤压式进入：从正中一道窄缝向两侧撑开 */
  rockSqueeze: {
    from: { autoAlpha: 1, clipPath: 'inset(0% 47% 0% 47%)', scale: 1.09 },
    to:   { autoAlpha: 1, clipPath: FULL_INSET,             scale: 1 },
  },

  /** 晨雾显形 */
  mistForm: {
    from: { autoAlpha: 0, scale: 1.03, filter: 'blur(17px) brightness(1.2) contrast(0.82)' },
    to:   { autoAlpha: 1, scale: 1,    filter: 'blur(0px) brightness(1) contrast(1)' },
  },
};

/* ── 退出 ───────────────────────────────────────────────────── */
export const EXITS = {
  /** 尘土擦拭：被一阵尘横向抹掉 */
  dustWipe: {
    to: { autoAlpha: 0, x: -230, filter: 'blur(9px) brightness(1.14)' },
  },

  /** 烟雾吞没城墙：整幅泛白、涨大、糊掉 */
  smokeSwallow: {
    to: { autoAlpha: 0, scale: 1.1, filter: 'blur(22px) brightness(1.34) contrast(0.7)' },
  },

  /** 船帆掠过：斜向遮挡自右扫过 */
  sailPass: {
    to: { clipPath: 'polygon(130% 0%, 130% 0%, 130% 100%, 106% 100%)' },
  },

  /** 浪峰遮挡：浪自下涌起吞掉画面 */
  waveCrest: {
    to: { clipPath: 'polygon(-30% 100%, 130% 100%, 130% 100%, -30% 100%)', filter: 'blur(5px)' },
  },

  /** 洞口收拢、黑暗压入：向独眼位置收成一点 */
  caveClose: {
    to: { clipPath: 'circle(0% at 54% 16%)', filter: 'brightness(0.72)' },
  },

  /** 洇墨 */
  inkBleed: {
    to: { autoAlpha: 0, filter: 'blur(26px) contrast(0.78)' },
  },

  /** 整体下沉 */
  sink: {
    to: { autoAlpha: 0, y: 210, scale: 0.97, filter: 'blur(7px)' },
  },

  /** 水面逐渐平静：不位移，只轻轻淡下去 */
  stillWater: {
    to: { autoAlpha: 0, filter: 'blur(3px) brightness(1.06)' },
  },
};

/** 幕的 root 层退出时是否需要单独接管 opacity（clipPath 类不需要） */
export const CLIP_EXITS = new Set(['sailPass', 'waveCrest', 'caveClose']);

export function enterOf(name) {
  return ENTERS[name] || ENTERS.dust;
}

export function exitOf(name) {
  return name ? EXITS[name] || EXITS.dustWipe : null;
}
