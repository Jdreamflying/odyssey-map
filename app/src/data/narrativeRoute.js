/**
 * ════════════════════════════════════════════════════════════════
 *  奥德赛叙事航线 —— 依荷马文本，而非现代最短路径
 * ════════════════════════════════════════════════════════════════
 *
 *  这不是「站点 A → 平滑曲线 → 站点 B」。
 *  每一段（leg）都对应文本中的一个航程事件，带卷次出处。
 *  几何由 via 点显式控制，不用样条自动补 —— 自动补正是上一版
 *  在斯库拉海峡「凭空多出第三次穿越」的原因。
 *
 *  ── 三种线型，本身即证据分级 ────────────────────────────
 *    certain      文本明确的航程关系          实线，陈年群青
 *    hypothetical 文本明确但现代地点属推测    虚线，更淡
 *    drift        被风吹回 / 残骸漂流         断续细线，不规则
 *
 *  ── 文本依据（Books IX–XIII）────────────────────────────
 *    IX    伊斯马罗斯 → 食莲人 → 独眼巨人
 *    X     风神岛 → 望见伊萨卡 → 风袋被开 → 吹回风神岛
 *          → 莱斯特律戈涅斯（仅奥德修斯一船生还）→ 埃埃亚岛
 *    XI    自埃埃亚岛往冥府，问忒瑞西阿斯
 *    XII   返回埃埃亚岛 → 塞壬 → 斯库拉与卡律布狄斯（第一次，
 *          失六人）→ 特里纳基亚（宰太阳神牛）→ 船毁，同伴尽亡
 *          → 独自抱龙骨被浪带回卡律布狄斯（第二次）→ 漂九日
 *    VII   → 俄古癸亚岛，滞留七年
 *    XIII  → 斯刻里亚 → 淮阿喀亚人送归伊萨卡
 *
 *  坐标一律为真实经纬度，经 bootMap 的 PROJECTION 投影。
 *  地点无法可靠定位者（多数神话地点）使用该项目证据体系中
 *  既有的「推定区域」坐标，并以 hypothetical 线型诚实标注。
 */

/** 线型 */
export const LEG_KIND = {
  CERTAIN: 'certain',
  HYPOTHETICAL: 'hypothetical',
  DRIFT: 'drift',
};

/**
 * 航段。
 *   from / to  站点 id（对应 stations 索引）
 *   via        中途控制点 [lon, lat]，每个都应有叙事或地理理由
 *   kind       线型
 *   book       文本出处
 *   label      航线重演时的提示
 */
export const LEGS = [
  {
    id: 'troy-ismaros', from: 0, to: 1, kind: LEG_KIND.CERTAIN, book: 'IX.39',
    via: [[25.6, 40.3]],
    label: '自特洛伊起航，顺色雷斯海岸西行',
  },
  {
    id: 'ismaros-storm', from: 1, to: 2, kind: LEG_KIND.HYPOTHETICAL, book: 'IX.62–84',
    /* 文本：北风把船队自马莱亚角外吹离航线九日 —— 故先南下绕伯罗奔尼撒 */
    via: [[24.2, 38.4], [23.2, 36.2], [21.0, 34.6], [18.4, 33.4]],
    label: '马莱亚角外遇北风，被吹离航线九日',
  },
  {
    id: 'lotus-cyclopes', from: 2, to: 3, kind: LEG_KIND.HYPOTHETICAL, book: 'IX.105',
    via: [[15.6, 34.6], [14.2, 36.2]],
    label: '离开食莲人之地，抵独眼巨人的海岸',
  },
  {
    id: 'cyclopes-aeolia', from: 3, to: 4, kind: LEG_KIND.HYPOTHETICAL, book: 'X.1',
    via: [[14.6, 38.2]],
    label: '抵风神埃俄罗斯的浮岛',
  },

  /* ── 全篇最重要的折返：望见故乡，又被吹回 ── */
  {
    id: 'aeolia-nearIthaca', from: 4, to: 'near-ithaca', kind: LEG_KIND.CERTAIN, book: 'X.28–55',
    /* 文本：顺风九日夜，第十日已能望见伊萨卡岸上的火光 */
    via: [[17.4, 38.6], [19.2, 38.4]],
    label: '顺风九日，第十日已望见伊萨卡的火光',
  },
  {
    id: 'nearIthaca-aeolia', from: 'near-ithaca', to: 4, kind: LEG_KIND.DRIFT, book: 'X.46–55',
    /* 同伴解开风袋，一船被吹回原处 —— 走一条略偏北的不同弧线，
       避免与去程重叠成一条线，读者才看得出「折返」 */
    via: [[19.0, 39.4], [17.2, 39.6], [15.4, 39.2]],
    label: '同伴解开风袋，暴风把船队吹回风神岛',
  },

  {
    id: 'aeolia-laestry', from: 4, to: 5, kind: LEG_KIND.HYPOTHETICAL, book: 'X.80',
    via: [[14.2, 39.6]],
    label: '航行六日至莱斯特律戈涅斯，仅奥德修斯一船生还',
  },
  {
    id: 'laestry-circe', from: 5, to: 6, kind: LEG_KIND.HYPOTHETICAL, book: 'X.135',
    via: [[13.4, 40.8]],
    label: '抵埃埃亚岛，喀耳刻之地',
  },

  /* ── 冥府往返：文本明确「去而复返」 ── */
  {
    id: 'circe-underworld', from: 6, to: 7, kind: LEG_KIND.HYPOTHETICAL, book: 'XI.1–22',
    /* 文本：北风送船一日至俄刻阿诺斯彼岸、日光不至之地 */
    via: [[11.4, 41.6], [9.6, 41.4]],
    label: '北风送行一日，至俄刻阿诺斯彼岸的冥府入口',
  },
  {
    id: 'underworld-circe', from: 7, to: 6, kind: LEG_KIND.HYPOTHETICAL, book: 'XII.1–7',
    /* 文本：离冥府后「重回埃埃亚岛」安葬厄尔佩诺耳 */
    via: [[9.8, 40.6], [11.8, 40.8]],
    label: '返回埃埃亚岛，安葬厄尔佩诺耳',
  },

  {
    id: 'circe-sirens', from: 6, to: 8, kind: LEG_KIND.HYPOTHETICAL, book: 'XII.166–200',
    via: [[13.2, 40.0]],
    label: '以蜡封耳，缚身桅杆，经过塞壬',
  },
  {
    id: 'sirens-scylla-1', from: 8, to: 9, kind: LEG_KIND.HYPOTHETICAL, book: 'XII.201–259',
    via: [[14.9, 38.6]],
    label: '第一次穿过海峡，斯库拉夺去六名同伴',
  },
  {
    id: 'scylla-thrinacia', from: 9, to: 10, kind: LEG_KIND.HYPOTHETICAL, book: 'XII.260–276',
    via: [[15.2, 37.6]],
    label: '抵特里纳基亚，太阳神之牛所在',
  },

  /* ── 船毁之后：只剩一人，线型必须改变 ── */
  {
    id: 'thrinacia-charybdis-2', from: 10, to: 9, kind: LEG_KIND.DRIFT, book: 'XII.403–446',
    /* 文本：宙斯雷击碎船，同伴尽亡；奥德修斯抱龙骨被南风带回卡律布狄斯，
       攀住岸上无花果树，等漩涡吐出桅杆 */
    via: [[15.4, 37.2], [15.5, 37.7]],
    label: '船毁人亡，独自抱龙骨被带回卡律布狄斯',
  },
  {
    id: 'charybdis-ogygia', from: 9, to: 11, kind: LEG_KIND.DRIFT, book: 'XII.447–453',
    /* 文本：其后漂流九日，第十日夜抵俄古癸亚 */
    via: [[13.8, 36.4], [12.0, 35.4], [10.4, 35.2]],
    label: '漂流九日，第十日夜抵俄古癸亚岛',
  },
  {
    id: 'ogygia-scheria', from: 11, to: 12, kind: LEG_KIND.DRIFT, book: 'V.263–493',
    /* 文本：自造木筏，航行十七日，第十八日望见斯刻里亚；
       波塞冬碎筏，泅游两日上岸 */
    via: [[12.4, 36.8], [16.0, 37.6], [18.6, 38.6]],
    label: '自造木筏十七日，筏碎后泅游两日上岸',
  },
  {
    id: 'scheria-ithaca', from: 12, to: 13, kind: LEG_KIND.CERTAIN, book: 'XIII.70–125',
    via: [[20.0, 38.9]],
    label: '淮阿喀亚人以快船一夜送他归伊萨卡',
  },
];

/** 「望见伊萨卡」不是站点，只是折返发生的位置 —— 伊萨卡外海 */
export const NEAR_ITHACA = { lon: 20.9, la: 38.35 };

/** 斯库拉海峡实际出现次数，供「怎么读这张图」引用 */
export const SCYLLA_PASSAGES = [
  { n: 1, kind: 'certain-order', book: 'XII.201–259', what: '船队第一次穿过，斯库拉夺去六人' },
  { n: 2, kind: 'drift', book: 'XII.426–446', what: '船毁后独自漂回，攀无花果树避开漩涡' },
];

export default LEGS;
