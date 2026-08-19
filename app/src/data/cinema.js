/**
 * ════════════════════════════════════════════════════════════════
 *  史诗序幕 —— 12 秒 · 主镜头与桥接镜头
 * ════════════════════════════════════════════════════════════════
 *
 *  上一版的问题：十二幕地位均等，像高质量快闪。
 *  本版按三个等级重组，让节奏有主次：
 *
 *    hero   主镜头 —— 停得住，是观众记得住的画面
 *           I 军势 · VI 独眼巨人 · VII 波塞冬 · VIII 塞壬 · X 斯库拉 · XII 伊萨卡
 *    accent 重音   —— 短促有力的一击
 *           III 城破 · IX 冥府
 *    bridge 桥接   —— 掠过即走，只交代「他离开了 / 他在海上」
 *           II 开拔 · IV 启航 · V 风暴 · XI 望乡
 *
 *  最长的 VIII（2.47s）与最短的 II（0.48s）相差 5.1 倍。
 */

export const EPIC_DURATION = 12.0;
export const ROLL_DURATION = 2.6;
export const TOTAL_DURATION = EPIC_DURATION + ROLL_DURATION;

export const TIER = { HERO: 'hero', ACCENT: 'accent', BRIDGE: 'bridge' };

/**
 * 每幕的刻度、等级与转场语法。
 * 构造规则不变：下一幕 start = 上一幕 exit，其 ENTER 时长 = 上一幕 EXIT 时长。
 */
export const CINEMA_CUES = {
  'troy-war-begins':    { tier: 'hero',   start: 0.00,  peak: 0.50,  exit: 1.35,  end: 1.53,  enter: 'spearRise',  exitFx: 'dustWipe' },
  'greek-army-march':   { tier: 'bridge', start: 1.35,  peak: 1.53,  exit: 1.71,  end: 1.83,  enter: 'dust',       exitFx: 'dustWipe' },
  'fall-of-troy':       { tier: 'accent', start: 1.71,  peak: 1.83,  exit: 2.28,  end: 2.46,  enter: 'dust',       exitFx: 'smokeSwallow' },
  'odysseus-departure': { tier: 'bridge', start: 2.28,  peak: 2.46,  exit: 2.66,  end: 2.82,  enter: 'sailWipe',   exitFx: 'sailPass' },
  'storm-at-sea':       { tier: 'bridge', start: 2.66,  peak: 2.82,  exit: 3.04,  end: 3.44,  enter: 'waveWipe',   exitFx: 'waveCrest' },
  'island-of-cyclops':  { tier: 'hero',   start: 3.04,  peak: 3.44,  exit: 4.39,  end: 4.65,  enter: 'caveOpen',   exitFx: 'caveClose' },
  'poseidon-appears':   { tier: 'hero',   start: 4.39,  peak: 4.65,  exit: 5.40,  end: 6.10,  enter: 'waveWipe',   exitFx: 'waveCrest' },
  'sirens':             { tier: 'hero',   start: 5.40,  peak: 6.10,  exit: 7.45,  end: 7.87,  enter: 'slowForm',   exitFx: 'inkBleed' },
  'underworld':         { tier: 'accent', start: 7.45,  peak: 7.87,  exit: 8.27,  end: 8.92,  enter: 'slowForm',   exitFx: 'sink' },
  'scylla-charybdis':   { tier: 'hero',   start: 8.27,  peak: 8.92,  exit: 9.82,  end: 10.17, enter: 'rockSqueeze',exitFx: 'sink' },
  'return-to-ithaca':   { tier: 'bridge', start: 9.82,  peak: 10.17, exit: 10.39, end: 10.97, enter: 'mistForm',   exitFx: 'stillWater' },
  'end-of-voyage':      { tier: 'hero',   start: 10.39, peak: 10.97, exit: 12.00, end: 12.00, enter: 'mistForm',   exitFx: null },
};

export const BEATS = [
  { time: 0.00,  event: 'start',           note: '卷首题名' },
  { time: 0.50,  event: 'army-stand',      note: 'I 长矛林立起 —— 主镜头' },
  { time: 1.83,  event: 'troy-hit',        note: 'III 城破重击' },
  { time: 2.46,  event: 'depart',          note: 'IV 帆掠过' },
  { time: 2.82,  event: 'storm',           note: 'V 浪扫过' },
  { time: 3.44,  event: 'cyclops-loom',    note: 'VI 洞口张开 —— 主镜头，停住' },
  { time: 4.65,  event: 'poseidon-hit',    note: 'VII 第一高潮' },
  { time: 6.10,  event: 'sirens-silence',  note: 'VIII 极慢现形 —— 全片最长停留' },
  { time: 7.87,  event: 'underworld-sink', note: 'IX 下沉' },
  { time: 8.27,  event: 'scylla-build',    note: 'X 岩壁挤压起势' },
  { time: 8.92,  event: 'scylla-hit',      note: 'X 第二高潮' },
  { time: 10.17, event: 'ithaca-sight',    note: 'XI 晨雾显形' },
  { time: 10.97, event: 'ithaca',          note: 'XII 定影' },
  { time: 12.00, event: 'roll-up',         note: '右下角起翘，沿对角线卷走' },
];

export const ITHAKA_TEXT = { in: 11.10, hold: 11.50, out: 11.78, gone: 12.00 };
export const PROLOGUE_TEXT = { in: 0.06, hold: 0.50, out: 0.95 };

export const VOLUME_MARKS = [
  { no: 'II', name: '海', en: 'The Sea', in: 2.74, hold: 2.96, out: 3.16 },
  { no: 'III', name: '渊与归', en: 'Abyss & Return', in: 7.52, hold: 7.74, out: 7.98 },
];

/** 卷纸离场与地图分阶段显现 */
export const ROLL = {
  start: 12.00,
  end: 14.60,
  cornerLift: [12.00, 12.55],   // 右下角先起翘
  travel:     [12.42, 14.30],   // 沿对角线卷走
  pullAway:   [13.90, 14.60],   // 被抽离
  mapPaper:   [12.30, 13.10],
  mapCoast:   [13.00, 13.55],
  mapGeo:     [13.35, 13.90],
  mapRoute:   [13.65, 14.15],
  mapNodes:   [13.95, 14.40],
  mapLabels:  [14.15, 14.60],
};

export const ASSETS = {
  music: 'audio/odyssey-intro.mp3',
  paperRoll: 'audio/paper-roll.mp3',
  parchmentCinema: 'textures/parchment-cinema.webp',
  parchmentMap: 'textures/parchment-map.webp',
  worldMap: null,
  landmarkDir: 'landmarks/',
};

export const assetUrl = (p) => `${import.meta.env.BASE_URL}${p}`;

export const MANUAL = {
  wheelToSeconds: 0.0016,
  keyStep: 0.35,
  touchToSeconds: 0.006,
  ease: 0.18,
};
