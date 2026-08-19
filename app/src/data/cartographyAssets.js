/**
 * ════════════════════════════════════════════════════════════════
 *  古地图美术资产清单
 * ════════════════════════════════════════════════════════════════
 *
 *  地图装饰正在从「程序生成」迁到「外部美术资产」。这个文件是**唯一**
 *  的登记处：加一张图 = 在 CARTOGRAPHY_ASSETS 里加一条记录，不需要
 *  改任何绘制代码。
 *
 *  文件本体放在 public/assets/cartography/<类目>/ 下，用法见那里的 README。
 *
 *  ── 坐标 ──────────────────────────────────────────────────────
 *  两种写法，二选一：
 *    { lon, la }  真实经纬度（**推荐**）—— 投影常数改了也不会跑位，
 *                 而且 debug 模式能检查它落在海里还是陆上
 *    { x, y }     直接给 SVG 用户坐标（viewBox 是 989 × 648）
 *
 *  ── scale ─────────────────────────────────────────────────────
 *  渲染高度**占地图高度的比例**，不是像素倍率。宽度由图片自身长宽比
 *  自动算出，不必手填。地图高 648 单位，所以 scale 0.06 ≈ 39 单位高。
 *  各类目的建议区间见 public/assets/cartography/README.md。
 *
 *  ── 其余字段 ──────────────────────────────────────────────────
 *    opacity    0–1，默认见 CATEGORIES 里各类目的 defaultOpacity
 *    rotation   角度，绕自身中心旋转
 *    blendMode  CSS mix-blend-mode，默认 multiply（墨压在纸上）
 *    anchor     'center'（默认）| 'bottom' —— 山脉、城堡这类「立在地上」
 *               的图元用 bottom，坐标点即它的底边中点
 *
 *  ⚠ 画面范围是经度 8.0–28.5、纬度 32.2–43.0。**超出一点点就等于没画**：
 *    la > 43.0 的资产 py 为负，整块渲染在画布上方，页面上永远看不见。
 */

/**
 * 类目登记。
 *
 * procedural 字段记的是「这个类目目前由哪段程序代码在画」——
 * 一旦该类目出现第一条资产，那段程序生成就自动停用（见 assetLayer 的
 * isCategoryTakenOver），免得资产和程序图叠在一起。
 * 想强制保留程序版本，把 keepProcedural 设成 true。
 */
export const CATEGORIES = {
  /* 山脉：资产一上，reliefPen 的排线山体全部让位 —— 两套山叠在一起最难看 */
  mountain:   { dir: 'mountains',   procedural: 'reliefPen.buildRelief（山脉排线）',
                defaultOpacity: 0.34, keepProcedural: false },

  ship:       { dir: 'ships',       procedural: 'seaPen.buildMaritime（程序帆船）',
                defaultOpacity: 0.4,  keepProcedural: false },

  /* 海怪 */
  sea:        { dir: 'sea',         procedural: 'seaPen.buildMaritime（程序海怪）',
                defaultOpacity: 0.4,  keepProcedural: false },

  /* 波浪刻线单独一类：加一只海怪不该把满海的波纹一起关掉。
     这一类默认保留程序版本 —— 程序波纹是成片铺开的底纹，
     资产里的浪带是**单件装饰**，两者是互补而不是替代关系。 */
  wave:       { dir: 'sea',         procedural: 'seaPen.buildWaves（成片波纹底纹）',
                defaultOpacity: 0.34, keepProcedural: true },

  /* 聚落默认保留程序版本：buildSettlements 画的是 19 个小城市记号
     **连同 ROMA / ATHENAE / CARTHAGO 这些拉丁地名**，那是信息不是装饰。
     资产里的城堡港镇是大幅风景插图（vignette），历史地图上两者本来就并存：
     小圆点标位置，大插图点缀。 */
  settlement: { dir: 'settlements', procedural: 'reliefPen.buildSettlements（城市记号 + 拉丁地名）',
                defaultOpacity: 0.42, keepProcedural: true },

  navigation: { dir: 'navigation',  procedural: 'cartography.buildWindRose + marginalia 小风玫瑰',
                defaultOpacity: 0.45, keepProcedural: false },

  note:       { dir: 'notes',       procedural: 'marginalia.buildMarginalia（拉丁注记、修改痕迹）',
                defaultOpacity: 0.45, keepProcedural: false },
};

/** 资产根目录，相对 BASE_URL */
export const ASSET_ROOT = 'assets/cartography/';

/**
 * 资产清单。
 *
 * 示例（放进第一张图时照抄这个形状，把注释删掉即可）：
 *
 *   {
 *     name: 'apennines',
 *     type: 'mountain',
 *     src: 'mountains/apennines.svg',
 *     lon: 13.4, la: 42.2,
 *     scale: 0.06,
 *     opacity: 0.48,
 *     rotation: -8,
 *     anchor: 'bottom',
 *   },
 */
/**
 * 摆放守则（本轮定下来的，加资产前先读一遍）
 *
 *  ① **一律实测，不靠目测。**每条记录的坐标都在页面里量过空旷半径
 *     （周围多大范围没有航线 / 站点 / 文字 / 别的资产），注释里的
 *     `净空 nn` 就是那个数，单位是 SVG 单位（地图 989 × 648）。
 *     图元的半宽 / 半高必须小于它。
 *
 *  ② **出框等于不存在。**py(la) 落在 0–648 之外的资产永远画不出来。
 *     上一版的 apennines-n 挂在 43.1N（画面上边界是 43.0N），
 *     整整一块山体从来没有渲染过 —— 已删。
 *
 *  ③ **尺寸按 18 世纪铜版图的比例**（也是 assetLayer 的 debug 校验区间）：
 *       山脉  高 3–8% 图高          帆船  宽 1–3% 图宽
 *       海怪  高 3–5%，摆边角        聚落  小记号，高 2.5–3.5%
 *       罗盘  高 5.5–10%，一主多次
 *
 *  ④ **每一件都要说得出为什么在这里。**海怪去边角、船在真实航路上、
 *     罗盘在开阔水面或海域咽喉、聚落在有史实依据的地点、
 *     山脉沿真实山脊。不为填空乱摆 —— 空白宁可留着。
 */
export const CARTOGRAPHY_ASSETS = [
  /* ══ 山脉 ══════════════════════════════════════════════════
     四块山体素材按地貌特征分配到真实山系，并沿山脊走向旋转。
     一块素材可以重复用在多处 —— 铜版地图本来就是同一套山块反复钤印。
     anchor:'bottom' 表示坐标点是山脚线的中点，山往上长。 */
  { name: 'apennines-s', type: 'mountain', src: 'mountains/range-high-massif.webp',
    lon: 16.1, la: 40.0, scale: 0.04, rotation: 34, opacity: 0.43, anchor: 'bottom' },
  /* 原来在 18.3E / 42.6N：那个点既在海里（迪纳拉山脊在东北方的内陆），
     山顶又被上边界切掉。沿真实山脊东移到黑山高地，整块进画、落在陆上，
     并收窄一档给同名标注让位。 */
  { name: 'dinara', type: 'mountain', src: 'mountains/range-jagged-peaks.webp',
    lon: 19.4, la: 42.15, scale: 0.038, rotation: 33, opacity: 0.42, anchor: 'bottom' },
  { name: 'pindus', type: 'mountain', src: 'mountains/range-jagged-peaks.webp',
    lon: 21.2, la: 39.9, scale: 0.046, rotation: 62, opacity: 0.44, anchor: 'bottom' },
  { name: 'taygetus', type: 'mountain', src: 'mountains/range-high-massif.webp',
    lon: 22.35, la: 37.15, scale: 0.032, rotation: 72, opacity: 0.4, anchor: 'bottom' },
  { name: 'creta-ida', type: 'mountain', src: 'mountains/range-broad-ridge.webp',
    lon: 24.7, la: 35.25, scale: 0.034, rotation: -4, opacity: 0.42, anchor: 'bottom' },
  { name: 'anatolia-taurus', type: 'mountain', src: 'mountains/range-high-massif.webp',
    lon: 27.15, la: 38.4, scale: 0.04, rotation: 14, opacity: 0.43, anchor: 'bottom' },
  /* 9.0E 时左半块整个滑出画面（x 从 −26 起算）。东移到泰勒阿特拉斯
     真正伸进突尼斯北部的那一段，并收窄一档。净空 61 */
  { name: 'atlas-tell', type: 'mountain', src: 'mountains/range-plateau-scarp.webp',
    lon: 9.7, la: 36.35, scale: 0.042, rotation: -8, opacity: 0.43, anchor: 'bottom' },
  { name: 'sicilia-interior', type: 'mountain', src: 'mountains/range-plateau-scarp.webp',
    lon: 13.9, la: 37.72, scale: 0.034, rotation: -6, opacity: 0.4, anchor: 'bottom' },

  /* ── 补三处真实山系：这三块内陆原本是全图最大的三片空白 ──
     不是「找地方塞山」，是这三条山脉本来就该在这张图上：
       斯卡尔杜斯 / 俄尔柏罗斯 —— 马其顿与派奥尼亚之间的分水岭，
                                古典地志里划分行省的那道墙。净空 70
       海姆斯     —— 色雷斯北面的巴尔干山，从希罗多德起就是北界。净空 37
       突尼斯背脊 —— 泰勒阿特拉斯向东南的延伸，隔开迦太基腹地与南部盐湖。净空 61 */
  { name: 'scardus-orbelus', type: 'mountain', src: 'mountains/range-jagged-peaks.webp',
    lon: 21.15, la: 41.85, scale: 0.05, rotation: -14, opacity: 0.42, anchor: 'bottom' },
  { name: 'haemus', type: 'mountain', src: 'mountains/range-broad-ridge.webp',
    lon: 25.9, la: 42.3, scale: 0.042, rotation: -6, opacity: 0.4, anchor: 'bottom' },
  { name: 'dorsale-tunisia', type: 'mountain', src: 'mountains/range-plateau-scarp.webp',
    lon: 9.6, la: 35.0, scale: 0.04, rotation: 18, opacity: 0.4, anchor: 'bottom' },

  /* ══ 聚落 ══════════════════════════════════════════════════
     上一版把它们当「大幅点景」画到 4.5–6.2% 图高，比旁边的山脉还抢眼，
     那是 19 世纪石印风景插图的做法，不是 18 世纪海图。海图上的城镇
     就是**小记号**：一枚城墙、一座塔、几根断柱，高 2.5–3.5%。
     位置一律挑有史实依据的地点。 */
  { name: 'carthago-city', type: 'settlement', src: 'settlements/walled-city.webp',
    lon: 10.3, la: 36.9, scale: 0.032, opacity: 0.5, anchor: 'bottom' },
  { name: 'cyrene-ruins', type: 'settlement', src: 'settlements/temple-ruins.webp',
    lon: 21.9, la: 32.9, scale: 0.03, opacity: 0.5, anchor: 'bottom' },
  { name: 'tarentum-harbour', type: 'settlement', src: 'settlements/harbour-town.webp',
    lon: 17.3, la: 40.5, scale: 0.028, opacity: 0.48, anchor: 'bottom' },
  { name: 'sardinia-lighthouse', type: 'settlement', src: 'settlements/lighthouse-rock.webp',
    lon: 9.5, la: 39.45, scale: 0.026, opacity: 0.48, anchor: 'bottom' },
  /* 内陆两枚：非洲一侧的断柱、色雷斯一侧的城墙。都是真地点，
     也正好落在南北两片最大的陆上空白里。净空 49 / 34 */
  { name: 'capsa-ruins', type: 'settlement', src: 'settlements/temple-ruins.webp',
    lon: 8.95, la: 34.05, scale: 0.03, opacity: 0.46, anchor: 'bottom' },
  { name: 'hadrianopolis-city', type: 'settlement', src: 'settlements/walled-city.webp',
    lon: 26.55, la: 41.68, scale: 0.03, opacity: 0.46, anchor: 'bottom' },

  /* ══ 帆船 ══════════════════════════════════════════════════
     桨帆船船首有眼、单帆多桨，是荷马时代地中海船的形制，
     放在故事主水域；卡拉克是 16 世纪船，放远一点的东地中海。
     全部收到宽 2–2.5% 图宽（上一版三条都顶在 2.4–3.0% 的上限）。
     每条船都压在一条真实航路上，而不是浮在随便一片水里。 */
  { name: 'galley-ionian', type: 'ship', src: 'ships/galley-oared.webp',
    lon: 19.9, la: 33.4, scale: 0.032, rotation: -3, opacity: 0.5 },
  /* 26.9E / 33.5N 正压在 bootMap 那枚会转的罗盘上（26.8E / 32.6N，半径 40），
     东南角本来就挤。北移到罗德岛外海的开阔水面，仍是黎凡特航线上。 */
  { name: 'carrack-levant', type: 'ship', src: 'ships/carrack-full-sail.webp',
    lon: 27.55, la: 35.15, scale: 0.034, rotation: 4, opacity: 0.48 },
  { name: 'galley-adriatic', type: 'ship', src: 'ships/galley-oared.webp',
    lon: 17.6, la: 42.2, scale: 0.028, rotation: -5, opacity: 0.46 },
  /* 中央爱奥尼亚：西西里 ↔ 伯罗奔尼撒的正对开水路，也是全图最大的空白。净空 58 */
  { name: 'galley-ionium-mid', type: 'ship', src: 'ships/galley-oared.webp',
    lon: 19.85, la: 36.35, scale: 0.03, rotation: 5, opacity: 0.48 },
  /* 科西嘉—托斯卡纳水道：西地中海南北向的主通道。净空 64 */
  { name: 'carrack-tyrrhenum-n', type: 'ship', src: 'ships/carrack-full-sail.webp',
    lon: 10.95, la: 41.15, scale: 0.03, rotation: -6, opacity: 0.47 },
  /* 克里特 ↔ 昔兰尼加横渡：古代运粮船最常走的一段外海。净空 46 */
  { name: 'galley-libycum-e', type: 'ship', src: 'ships/galley-oared.webp',
    lon: 25.15, la: 34.15, scale: 0.028, rotation: -4, opacity: 0.46 },

  /* ══ 海怪 ══════════════════════════════════════════════════
     上一版三只都在图心一带（18.6E / 24.3E / 10.6E 的中纬），
     成了地图的主视觉。铜版海图上海怪的位置是有讲究的：它们属于
     **图纸边角的余白**，是雕版师填角用的，不是海域的主角。
     三只一律缩到 4% 图高并挪到东南 / 东 / 西三个边缘。 */
  { name: 'serpent-internum', type: 'sea', src: 'sea/sea-serpent-horned.webp',
    lon: 17.3, la: 32.72, scale: 0.042, rotation: -3, opacity: 0.46 },
  { name: 'whale-libycum', type: 'sea', src: 'sea/whale-spouting.webp',
    lon: 27.05, la: 34.5, scale: 0.04, rotation: 2, opacity: 0.44 },
  { name: 'dragon-tyrrhenum', type: 'sea', src: 'sea/sea-dragon-finned.webp',
    lon: 8.85, la: 38.25, scale: 0.04, rotation: -4, opacity: 0.44 },

  /* ══ 波浪带 ══════════════════════════════════════════════════
     单件装饰，成片的波纹底纹仍由程序绘制（见 CATEGORIES.wave）。
     这三条刻线带的作用是给中央那几片死白的水面一点纹理 ——
     铜版图的开阔洋面从来不是空的，总有一层横向水纹。 */
  { name: 'wave-band-ionium', type: 'wave', src: 'sea/wave-band.webp',
    lon: 17.15, la: 35.55, scale: 0.028, rotation: -1, opacity: 0.32 },
  { name: 'wave-band-malta', type: 'wave', src: 'sea/wave-band.webp',
    lon: 14.65, la: 34.85, scale: 0.024, rotation: 1, opacity: 0.3 },
  { name: 'wave-band-libycum', type: 'wave', src: 'sea/wave-band.webp',
    lon: 19.4, la: 32.6, scale: 0.024, rotation: 0, opacity: 0.3 },

  /* ══ 罗盘 ══════════════════════════════════════════════════
     取代程序生成的大风玫瑰与三个小风向标。

     判断一朵风玫瑰该不该在那儿，只看一条：**它是不是一件导航工具。**
     海图上的罗盘是用来量方位、拉恒向线的，所以它只出现在
     ① 成片的开阔水面（线不被陆地打断）
     ② 两片海域交汇、航路必经的咽喉
     一主三次，尺寸拉开层级，不平均散布：主罗盘在西地中海最大的一片
     空水，另外三朵各守一处咽喉。

     已删：anchor-aegean-s（26.6E / 35.6N）。锚记号在海图上表示
     **可抛锚的锚地**，必须贴着岸；那个坐标在卡尔帕托斯与罗德岛之间的
     深水海峡中央，没有任何锚地，纯属装饰。改为下面贴着迦太基外海的一枚。 */
  { name: 'rose-west', type: 'navigation', src: 'navigation/compass-rose.webp',
    lon: 10.7, la: 38.3, scale: 0.092, opacity: 0.5 },
  /* 西西里海峡：地中海东西两盆之间唯一的门，从腓尼基人到 18 世纪
     所有东西向航行都要穿过它。净空 58 */
  { name: 'rose-sicily-strait', type: 'navigation', src: 'navigation/compass-rose.webp',
    lon: 12.2, la: 36.6, scale: 0.058, rotation: -4, opacity: 0.44 },
  /* 中央爱奥尼亚：MARE·IONIVM / INTERNVM / LIBYCVM 三片海域在此交汇，
     也是全图唯一一处半径 67 单位内什么都没有的水面。净空 67 */
  { name: 'rose-ionium', type: 'navigation', src: 'navigation/compass-rose.webp',
    lon: 18.55, la: 36.2, scale: 0.072, rotation: 3, opacity: 0.46 },
  { name: 'rose-libycum', type: 'navigation', src: 'navigation/compass-rose.webp',
    lon: 22.2, la: 33.7, scale: 0.06, rotation: 6, opacity: 0.42 },
  /* 爱琴海北部（阿托斯半岛外海）：全图第五朵、也是最小的一朵。
     爱琴海主体岛礁密布、航线密集，实测下来只有这一处有 25 单位净水；
     其余候选点（利姆诺斯以南、基克拉泽斯以东、克里特海）净空都不到 16，
     硬塞一朵进去就成了「为填空而填」。这一朵贴着特洛伊→马莱亚角那条航线，
     符合「罗盘长在航路旁」的道理。净空 25，rose 半径 16 */
  { name: 'rose-aegean-n', type: 'navigation', src: 'navigation/compass-rose.webp',
    lon: 24.45, la: 39.75, scale: 0.05, rotation: -5, opacity: 0.4 },
  /* 唯一一枚锚：迦太基外海的锚地，紧贴着上面那枚城墙记号。
     锚与城成对出现是海图的定式 —— 城告诉你那里有人，锚告诉你船能停。净空 19 */
  { name: 'anchor-carthago', type: 'navigation', src: 'navigation/anchor.webp',
    lon: 11.35, la: 36.3, scale: 0.032, rotation: -7, opacity: 0.42 },
];

/** 某个类目当前有几条资产 */
export function assetsOfType(type) {
  return CARTOGRAPHY_ASSETS.filter((a) => a.type === type);
}

/**
 * 这个类目是否已经由资产接管。
 * 有资产 且 没有强制保留程序版本 → 接管。
 */
export function isCategoryTakenOver(type) {
  const cat = CATEGORIES[type];
  if (!cat || cat.keepProcedural) return false;
  return assetsOfType(type).length > 0;
}
