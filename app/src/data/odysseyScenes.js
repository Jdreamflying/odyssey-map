/**
 * ════════════════════════════════════════════════════════════════
 *  Odyssey Timeline — 十二节点数据源（唯一真相）
 * ════════════════════════════════════════════════════════════════
 *
 *  本文件是全站唯一的场景配置与图片路径来源。
 *  组件不得硬编码任何 /assets 或 /scenes 路径。
 *
 *  参数依据：TIMELINE.html「参数总表 Tab.2」与 VISUAL-BIBLE.html 第 III / IV 版。
 *
 *  ── 进度字段 ──────────────────────────────────────────────
 *  每一幕在主时间轴（归一化 0→1）上占据四个刻度：
 *
 *     start ──▶ peak ──────▶ exit ──▶ end
 *     │         │            │        │
 *     │ ENTER   │    HOLD    │  EXIT  │
 *     淡入完成于 peak，自 exit 起淡出，end 时完全消失。
 *
 *  构造规则：下一幕的 start 恰好等于上一幕的 exit，且其 ENTER 时长
 *  等于上一幕的 EXIT 时长。于是两幕的淡入淡出完全互补 —— 这段重叠
 *  就是 cross dissolve，且任一时刻最多只有两幕可见，不会三幕叠加。
 *  溶接长度因此成为可逐对调节的显式参数（见各幕 peak−start）。
 *
 *  ── textSide ─────────────────────────────────────────────
 *  'left'（默认）| 'right'。文字牌用深墨色，压在深色主体上会读不出来。
 *  仅在该幕图片左下确实被深色主体占据时才置 'right'，逐图判断。
 */

/* ── 图片资源表 ───────────────────────────────────────────────
 * 全部路径集中于此。base 为 './' 打包，故用相对路径写法由 Vite 处理。
 * null = 该幕尚无 AI 图，渲染 SCENE IMAGE MISSING 占位版。
 */
const IMG = (file) => `${import.meta.env.BASE_URL}scenes/${file}`;

export const SCENE_IMAGES = {
  troyWarBegins:      IMG('01-troy-war-begins.png'),
  greekArmyMarch:     IMG('02-greek-army-march.png'),
  fallOfTroy:         IMG('03-fall-of-troy.png'),
  odysseusDeparture:  IMG('04-odysseus-departure.png'),
  stormAtSea:         IMG('05-storm-at-sea.png'),
  islandOfCyclops:    IMG('06-island-of-cyclops.png'),
  poseidonAppears:    IMG('07-poseidon-appears.png'),
  sirens:             IMG('08-sirens.png'),
  underworld:         IMG('09-underworld.png'),
  scyllaCharybdis:    IMG('10-scylla-charybdis.png'),
  returnToIthaca:     IMG('11-return-to-ithaca.png'),
  endOfVoyage:        IMG('12-end-of-voyage.png'),
};

/* ── 转场五式（VISUAL-BIBLE 卷二 Tab.1）────────────────────────
 * 每一式即该幕的 EXIT 动作。fix 为终幕专用：不位移、不消失。
 */
export const TRANSITIONS = {
  leaf:      { label: '揭页',   x: -240 },
  leafRight: { label: '揭页·右', x:  260 },
  submerge:  { label: '沉降',   y:  180 },
  inkbleed:  { label: '洇墨',   blur: 24 },
  plateLift: { label: '落幕',   scale: 1.06 },
  fix:       { label: '定影',   hold: true },
};

/* ── 主时间轴常量 ───────────────────────────────────────────── */
export const TIMELINE = {
  /** 长卷总滚动高度。0→0.86 为十二幕，0.86→1.0 为归乡段（约 218vh）。 */
  totalVh: 1560,
  /** ScrollTrigger scrub 阻尼（秒）。停止滚动即停在当前帧。 */
  scrub: 0.8,
  /** 触发 onTimelineComplete 的进度阈值。 */
  completeAt: 0.996,

  /* ── 自动推进 ──────────────────────────────────────────────
   * 自动播放推进的是 scroll position 本身，ScrollTrigger 仍是唯一状态源，
   * 绝不直接写 timeline.progress()，以免与浏览器滚动位置打架。 */
  autoplay: {
    /** 每秒推进的进度比例。0.006 ≈ 走完全程约 2.8 分钟。 */
    rate: 0.006,
    /** 用户停止操作后，恢复自动推进的静默延迟（毫秒）。 */
    idleResumeDelay: 2600,
    /** 进入页面后首次启动的延迟（毫秒），给卷首题名留出呼吸。 */
    startDelay: 1200,
  },
};

/* ── 卷标记（卷切换时极弱地出现一次，非常驻卡片）───────────────
 * 只在卷一→卷二、卷二→卷三 两处出现；卷一开头由卷首题名承担。 */
export const VOLUME_MARKS = [
  { no: 'II', name: '海', en: 'The Sea', in: 0.219, hold: 0.243, out: 0.263 },
  { no: 'III', name: '渊与归', en: 'Abyss & Return', in: 0.550, hold: 0.574, out: 0.594 },
];

/* ── 卷首题名 ───────────────────────────────────────────────── */
export const PROLOGUE = { in: 0.002, hold: 0.022, out: 0.044 };

/* ── 十二幕 ─────────────────────────────────────────────────── */
export const ODYSSEY_SCENES = [
  {
    id: 'troy-war-begins',
    no: 'I',
    volume: 1,
    volumeName: '城',
    title: 'Troy War Begins',
    subtitle: '特洛伊战争爆发',
    text: [
      '千帆渡海而来，为夺回一个女人。',
      '十年围城自此开始。',
    ],
    image: SCENE_IMAGES.troyWarBegins,
    foregroundImage: null,
    fit: 'contain',
    frame: { width: '96%' },
    intensity: 38,
    transition: 'leafRight',
    /* 开场特例：军势自极远处接近。bg 由 0.80 放大至 1.06，
       并于 EXIT 时整体向右移出——不硬切，右侧退场后下一幕浮现。 */
    enter: { scale: 1.10, blur: 14 },
    /* fromScale 下限受背景层 overscan 约束：背景为视口的 124%×120%，
       低于 0.85 会在四边露出纸底。0.88 留 1.9% 安全余量。 */
    camera: {
      bg: { x: 70, y: 0, scale: 1.06, fromScale: 0.88 },
      fg: { x: -40, y: 0, scale: 1.02 },
    },
    particles: { type: 'dust', count: 26 },
    start: 0.000, peak: 0.031, exit: 0.071, end: 0.093,
    note: '希腊军势自极远处向观众逼近：大量士兵、长矛、圆盾、战马、战车，远处尘土。初始极小极远，随滚动逐渐放大接近，随后整体右移出画。',
  },
  {
    id: 'greek-army-march',
    no: 'II',
    volume: 1,
    volumeName: '城',
    title: 'Greek Army March',
    subtitle: '希腊军队开拔',
    text: [
      '滩头列阵，向城墙推进。',
      '十年间这样的行军重复了无数次。',
    ],
    image: SCENE_IMAGES.greekArmyMarch,
    foregroundImage: null,
    fit: 'contain',
    frame: { width: '92%' },
    intensity: 52,
    /* 左三分之一为近黑的战车与武将群，进场即与文字牌重叠；
       右下是细密中间调的军阵纵深，是全图最宜承文字处。 */
    textSide: 'right',
    transition: 'leaf',
    camera: {
      bg: { x: -120, y: 0, scale: 1.01 },
      fg: { x: 70, y: 0, scale: 1.02 },
    },
    particles: { type: 'dust', count: 22 },
    start: 0.071, peak: 0.093, exit: 0.119, end: 0.141,
    note: null,
  },
  {
    id: 'fall-of-troy',
    no: 'III',
    volume: 1,
    volumeName: '城',
    title: 'Fall of Troy',
    subtitle: '特洛伊陷落',
    text: [
      '木马入城，当夜城破。',
      '他赢得了战争，也招来了神的记恨。',
    ],
    image: SCENE_IMAGES.fallOfTroy,
    foregroundImage: null,
    fit: 'contain',
    frame: { width: '95%' },
    intensity: 74,
    /* 左下为近黑的前景武将；右下有大块浅调石材与断柱，明度高出一档。 */
    textSide: 'right',
    transition: 'submerge',
    /* 校准：原 +100 会把左侧深色武将拉进文字区。改为 −90 揭示右侧的
       火场与坍塌列柱，方向亦更贴合「向火中推进」。前景同步反号保持对冲。 */
    camera: {
      bg: { x: -90, y: 0, scale: 1.08 },
      fg: { x: 60, y: 0, scale: 1.03 },
    },
    particles: { type: 'ash', count: 34 },
    start: 0.119, peak: 0.141, exit: 0.179, end: 0.201,
    note: null,
  },
  {
    id: 'odysseus-departure',
    no: 'IV',
    volume: 1,
    volumeName: '城',
    title: 'Odysseus Departure',
    subtitle: '奥德修斯启航',
    text: [
      '所有人都以为几周即可到家。',
      '这是最后一次风平浪静。',
    ],
    image: SCENE_IMAGES.odysseusDeparture,
    foregroundImage: null,
    fit: 'contain',
    frame: { width: '94%' },
    intensity: 44,
    /* 左半被船身、桨与桨手占满且偏暗；右侧为船队与开阔海面。 */
    textSide: 'right',
    transition: 'plateLift',
    /* 全篇唯一 scale 保持 1.00 的一幕：镜头在放手，不再靠近。
       校准：原 +110 揭示左侧船身，改为 −90 揭示右侧船队与开阔海面，
       顺离港方向。前景同步反号。 */
    camera: {
      bg: { x: -90, y: 0, scale: 1.0 },
      fg: { x: 55, y: 0, scale: 1.0 },
    },
    particles: { type: 'spray', count: 18 },
    start: 0.179, peak: 0.201, exit: 0.225, end: 0.248,
    note: null,
  },
  {
    id: 'storm-at-sea',
    no: 'V',
    volume: 2,
    volumeName: '海',
    title: 'Storm at Sea',
    subtitle: '海上风暴',
    text: [
      '船队被吹散，从此再没有回到航线上。',
      '他失去了同伴，也失去了方向。',
    ],
    image: SCENE_IMAGES.stormAtSea,
    foregroundImage: null,
    fit: 'cover',
    frame: { width: '100%', height: '100%' },
    intensity: 68,
    transition: 'submerge',
    camera: {
      bg: { x: -105, y: -18, scale: 1.06 },
      fg: { x: 60, y: 12, scale: 1.03 },
    },
    particles: { type: 'rain', count: 40 },
    start: 0.225, peak: 0.248, exit: 0.287, end: 0.310,
    note: '巨浪自左上压下，单船倾斜三十度、桅杆折断，无地平线，风暴云与水构成贯穿全画的斜向漩流。',
  },
  {
    id: 'island-of-cyclops',
    no: 'VI',
    volume: 2,
    volumeName: '海',
    title: 'Island of Cyclops',
    subtitle: '独眼巨人之岛',
    text: [
      '他自称「无人」，刺瞎了巨人的独眼。',
      '而巨人是波塞冬的儿子。',
    ],
    image: SCENE_IMAGES.islandOfCyclops,
    foregroundImage: null,
    fit: 'custom',
    frame: { width: '98%', height: '92%', x: '0%', y: '3%' },
    intensity: 72,
    /* ⚠ 独眼保护：巨人的头顶距画面上缘仅约 3%，独眼位于上部约 11% 处。
       原先 cover + 124%/120% overscan + scale 1.09 会切掉顶部约 17%，
       独眼首当其冲。改为 custom：整幅 contain 进一块 98%×92% 的图版，
       并整体下移 3%，使独眼落在视口上三分之一、成为第一视觉焦点。
       推近随之由 1.09 收到 1.03、横移由 −80 收到 −46 —— 洞穴的收拢感
       改由图版本身的小幅推近承担，不再以牺牲构图换取。 */
    transition: 'leaf',
    camera: {
      bg: { x: -46, y: 0, scale: 1.03 },
      fg: { x: 30, y: 0, scale: 1.02 },
    },
    particles: { type: 'dust', count: 20 },
    start: 0.287, peak: 0.310, exit: 0.347, end: 0.373,
    note: null,
  },
  {
    id: 'poseidon-appears',
    no: 'VII',
    volume: 2,
    volumeName: '海',
    title: 'Poseidon Appears',
    subtitle: '波塞冬显现',
    text: [
      '为子复仇，撼地者亲自出手。',
      '此后每一朵浪都带着神的名字。',
    ],
    image: SCENE_IMAGES.poseidonAppears,
    foregroundImage: null,
    fit: 'contain',
    frame: { width: '96%' },
    intensity: 92,
    /* 全篇最高峰：横移与推近同时接近上限，并带向下的 y 位移。
       校准：−145 会把神推离画面中心约 11%，三叉戟逼近左缘；收到 −120，
       前景按原 1:0.62 比例同步收到 +75。 */
    transition: 'submerge',
    camera: {
      bg: { x: -120, y: -20, scale: 1.08 },
      fg: { x: 75, y: 16, scale: 1.05 },
    },
    particles: { type: 'spray', count: 46 },
    start: 0.347, peak: 0.373, exit: 0.435, end: 0.478,
    note: null,
  },
  {
    id: 'sirens',
    no: 'VIII',
    volume: 2,
    volumeName: '海',
    title: 'Sirens',
    subtitle: '塞壬',
    text: [
      '他听见了，也挣扎了。',
      '但绳索没有松。',
    ],
    image: SCENE_IMAGES.sirens,
    foregroundImage: null,
    fit: 'contain',
    frame: { width: '92%' },
    intensity: 30,
    /* 全篇最低谷。危险来自静止——镜头几乎不动，这是刻意的反差。 */
    transition: 'inkbleed',
    enter: { scale: 1.02, blur: 6 },
    camera: {
      bg: { x: 50, y: 0, scale: 1.02 },
      fg: { x: -28, y: 0, scale: 1.01 },
    },
    particles: { type: 'mist', count: 10 },
    start: 0.435, peak: 0.478, exit: 0.556, end: 0.588,
    note: '海面平得反常，排线间距达「微」档。塞壬伏于左侧礁石，形体一半被雾状疏排线吞没。桅杆与被缚的人在右侧，是画面唯一线条紧实处。天空完全留白。',
  },
  {
    id: 'underworld',
    no: 'IX',
    volume: 3,
    volumeName: '渊与归',
    title: 'Underworld',
    subtitle: '冥府',
    text: [
      '他三次伸手拥抱母亲，三次抓空。',
      '为问归途，他下到了这里。',
    ],
    image: SCENE_IMAGES.underworld,
    foregroundImage: null,
    fit: 'cover',
    frame: { width: '100%', height: '100%' },
    intensity: 46,
    /* 全篇唯一以垂直位移为主的一幕：镜头在下沉。 */
    transition: 'inkbleed',
    camera: {
      bg: { x: -45, y: -70, scale: 1.06 },
      fg: { x: 25, y: 45, scale: 1.02 },
    },
    particles: { type: 'mist', count: 16 },
    start: 0.556, peak: 0.588, exit: 0.628, end: 0.650,
    note: '亡魂自下而上层层退入深处，愈远排线愈疏，最终化为空白。奥德修斯背影在前景下方，是唯一勾满实线的形体。无地平线，无天空。',
  },
  {
    id: 'scylla-charybdis',
    no: 'X',
    volume: 3,
    volumeName: '渊与归',
    title: 'Scylla and Charybdis',
    subtitle: '斯库拉与卡律布狄斯',
    text: [
      '没有两全的选择。',
      '他用六个同伴，换了整条船。',
    ],
    image: SCENE_IMAGES.scyllaCharybdis,
    foregroundImage: null,
    fit: 'contain',
    frame: { width: '96%' },
    intensity: 88,
    /* 第二个峰：横移取全篇最大值。旋涡的旋转错觉由前景反向位移造成，
       不使用真实 rotation ——避免游戏特效感。 */
    transition: 'submerge',
    camera: {
      bg: { x: -150, y: 0, scale: 1.06 },
      fg: { x: 95, y: 0, scale: 1.06 },
    },
    particles: { type: 'spray', count: 38 },
    start: 0.628, peak: 0.650, exit: 0.710, end: 0.738,
    note: '海峡一分为二：左为绝壁与探出的多头剪影，右为巨大同心弧漩涡，向心加密至最深。船夹在正中窄缝，中缝几乎全白。',
  },
  {
    id: 'return-to-ithaca',
    no: 'XI',
    volume: 3,
    volumeName: '渊与归',
    title: 'Return to Ithaca',
    subtitle: '重返伊萨卡',
    text: [
      '二十年后，他独自一人回来。',
      '山体自雾中缓缓浮现——那是他的国家。',
    ],
    image: SCENE_IMAGES.returnToIthaca,
    foregroundImage: null,
    fit: 'contain',
    frame: { width: '94%' },
    intensity: 40,
    /* 仍属「旅程」：镜头运动开始明显减弱，但尚未停止。
       过渡参数：原 +75 把左下小船继续推进文字区，改为 −70 揭示右侧山体，
       呼应「山体自雾中浮现」。待 XI 重出后再复核。 */
    transition: 'leaf',
    camera: {
      bg: { x: -70, y: 0, scale: 1.02 },
      fg: { x: 40, y: 0, scale: 1.01 },
    },
    particles: { type: 'mist', count: 14 },
    start: 0.710, peak: 0.738, exit: 0.771, end: 0.800,
    note: null,
  },
  {
    id: 'end-of-voyage',
    no: 'XII',
    volume: 3,
    volumeName: '渊与归',
    title: 'The End of Voyage',
    subtitle: '航程终点',
    text: [
      '只剩下海、伊萨卡、小船与天空。',
      '抵达之后，故事不再需要镜头。',
    ],
    image: SCENE_IMAGES.endOfVoyage,
    foregroundImage: null,
    fit: 'contain',
    frame: { width: '96%' },
    intensity: 16,
    /* 终幕 · 定影：不位移、不消失。淡入后一直保持到长卷结束，
       留出一段静止的 scroll space，其间 ΙΘΑΚΗ 极缓浮现。 */
    transition: 'fix',
    final: true,
    enter: { scale: 1.03, blur: 6 },
    camera: {
      bg: { x: 30, y: 0, scale: 1.01 },
      fg: { x: -18, y: 0, scale: 1.0 },
    },
    particles: { type: 'mist', count: 8 },
    start: 0.771, peak: 0.800, exit: 1.0, end: 1.0,
    note: '只余海、伊萨卡、小船、天空。无神、无怪物、无战争、无风暴。排线覆盖率降至下限，天空是全画最大的一片留白。',
  },
];

/* ── 卷（三卷四节）───────────────────────────────────────────── */
export const VOLUMES = [
  { no: 1, greek: 'Α', name: '城',     en: 'The City',            range: 'I–IV' },
  { no: 2, greek: 'Β', name: '海',     en: 'The Sea',             range: 'V–VIII' },
  { no: 3, greek: 'Γ', name: '渊与归', en: 'Abyss & Return',      range: 'IX–XII' },
];

/** 尚缺 AI 图的幕（用于开发期清点）。 */
export const MISSING_IMAGES = ODYSSEY_SCENES.filter((s) => !s.image).map((s) => s.no);

export default ODYSSEY_SCENES;
