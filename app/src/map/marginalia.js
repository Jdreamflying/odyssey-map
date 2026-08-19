/**
 * ════════════════════════════════════════════════════════════════
 *  边注笔 —— 制图者的手迹
 * ════════════════════════════════════════════════════════════════
 *
 *  一张 18 世纪的手稿海图和一张「印刷品」的区别，往往不在主体，
 *  而在这些边角上的东西：抄写员补的拉丁注记、划掉又改过的地名、
 *  指着某处的小箭头、空白处补的小风向标、以及一句
 *  HIC·SVNT·LEONES。它们说明这张图是**有人用过的**。
 *
 *  全部压到极低透明度 —— 目的是让人第二眼才发现，不是抢主体。
 *
 *  位置一律走 seaPen 的就近安置器：给一个理想经纬度，找不到合格空白
 *  就螺旋向外找，实在没有就跳过。所以岸线数据或禁区一变，这些东西
 *  会自己让开，而不是压在陆地或航线上。
 */

import { toBezier, mulberry } from './pen.js';
import { makeSpotFinder } from './seaPen.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (t, a = {}) => {
  const n = document.createElementNS(NS, t);
  for (const k in a) n.setAttribute(k, a[k]);
  return n;
};

/* ── 小风向标 ────────────────────────────────────────────────
   大罗盘只放一个；空海里再点几个八向小风标，是波特兰图的常规做法。 */
function smallRose(r, seed) {
  const g = el('g', { class: 'mrg__rose' });
  const rnd = mulberry(seed);
  g.appendChild(el('circle', { r: r.toFixed(1), class: 'mrg__rose-ring' }));
  g.appendChild(el('circle', { r: (r * 0.22).toFixed(1), class: 'mrg__rose-ring' }));

  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8 - Math.PI / 2;
    const a1 = a - Math.PI / 26;
    const a2 = a + Math.PI / 26;
    const tip = [Math.cos(a) * r, Math.sin(a) * r];
    const in1 = [Math.cos(a1) * r * 0.22, Math.sin(a1) * r * 0.22];
    const in2 = [Math.cos(a2) * r * 0.22, Math.sin(a2) * r * 0.22];
    g.appendChild(el('path', {
      d: `M${in1[0].toFixed(1)} ${in1[1].toFixed(1)} L${tip[0].toFixed(1)} ${tip[1].toFixed(1)} `
       + `L0 0 Z`,
      class: `mrg__blade${i % 2 ? '' : ' mrg__blade--dark'}`,
    }));
    g.appendChild(el('path', {
      d: `M${in2[0].toFixed(1)} ${in2[1].toFixed(1)} L${tip[0].toFixed(1)} ${tip[1].toFixed(1)} `
       + `L0 0 Z`,
      class: `mrg__blade${i % 2 ? ' mrg__blade--dark' : ''}`,
    }));
  }
  /* 四分风的细刻度 */
  for (let i = 0; i < 16; i++) {
    if (i % 2 === 0) continue;
    const a = (i * Math.PI * 2) / 16 - Math.PI / 2;
    g.appendChild(el('line', {
      x1: (Math.cos(a) * r * 0.78).toFixed(1), y1: (Math.sin(a) * r * 0.78).toFixed(1),
      x2: (Math.cos(a) * r).toFixed(1), y2: (Math.sin(a) * r).toFixed(1),
      class: 'mrg__tick',
    }));
  }
  /* 北向的百合花头，略微歪一点，像手画的 */
  const fy = -r * 1.02;
  g.appendChild(el('path', {
    d: `M0 ${(fy - r * 0.26).toFixed(1)} L${(r * 0.08).toFixed(1)} ${fy.toFixed(1)} `
     + `L0 ${(fy + r * 0.12).toFixed(1)} L${(-r * 0.08).toFixed(1)} ${fy.toFixed(1)} Z`,
    class: 'mrg__fleur',
    transform: `rotate(${(rnd() * 6 - 3).toFixed(1)})`,
  }));
  return g;
}

/* ── 手写注记 ────────────────────────────────────────────────
   用连笔感的斜体，沿一条微微起伏的基线排，像蘸水笔顺手写上去的。 */
function annotation(text, { size = 5.2, tilt = -2.4, key }) {
  const g = el('g', { class: 'mrg__note' });
  /* 基线：一条很浅的弧，让字不齐。
     ⚠ 这条弧必须比字**长**。textPath 会把中点落在路径之外的字形整个丢掉，
     不报错、不换行，就是安安静静少几个字母 —— 之前 MARE·PERICVLOSVM 显示成
     「RE·PERICVLOS」、TERRA·INCOGNITA 显示成「RRA·INCOGNI」，就是这么来的。
     旧系数 0.62 只算了字宽，漏掉了下面 letter-spacing 的 0.22，两头各吃掉一个多字母。
     现在按「字宽 + 字距」估，再留两个字身的余量；路径比字长没有副作用，
     startOffset 50% + text-anchor middle 会把字居中在弧上。 */
  const w = text.length * size * 0.9 + size * 2;
  const base = [];
  for (let i = 0; i <= 6; i++) {
    const u = i / 6;
    base.push([-w / 2 + u * w, Math.sin(u * Math.PI) * -0.9]);
  }
  const defs = el('defs');
  defs.appendChild(el('path', { id: key, d: toBezier(base, false, 1), fill: 'none' }));
  g.appendChild(defs);

  const t = el('text', { class: 'mrg__note-t', 'font-size': size, 'letter-spacing': size * 0.22 });
  const tp = document.createElementNS(NS, 'textPath');
  tp.setAttribute('href', `#${key}`);
  tp.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${key}`);
  tp.setAttribute('startOffset', '50%');
  tp.setAttribute('text-anchor', 'middle');
  tp.textContent = text;
  t.appendChild(tp);
  g.appendChild(t);
  g.setAttribute('transform', `rotate(${tilt})`);
  return g;
}

/* ── 修改痕迹：划掉的旧名 + 上方补写的新名 ──────────────────
   抄本上最常见的一种手迹。这里不写具体地名（免得和真实地理打架），
   只做出「改过」的形态。 */
function correction(key) {
  const g = el('g', { class: 'mrg__fix' });
  g.appendChild(el('path', {
    d: 'M-11 0 L11 0.6', class: 'mrg__strike',
  }));
  g.appendChild(el('path', {
    d: 'M-10.4 -1.6 q4 1.2 8 -0.4 q4 -1.4 7.6 0.2', class: 'mrg__scribble',
  }));
  g.appendChild(el('path', {
    d: 'M-6 -5.6 q5 -1.4 10 0.2 M2 -7.4 q3 1.2 4.6 2.4', class: 'mrg__scribble',
  }));
  /* 插入符号 */
  g.appendChild(el('path', { d: 'M-1.6 1.8 L0 -0.4 L1.6 1.8', class: 'mrg__caret' }));
  return g;
}

/* ── 指示箭头：细杆 + 小箭头，像批注时随手指过去的 ──────────── */
function arrow(len, ang, seed) {
  const g = el('g', { class: 'mrg__arrow' });
  const rnd = mulberry(seed);
  const pts = [];
  for (let i = 0; i <= 5; i++) {
    const u = i / 5;
    pts.push([u * len, Math.sin(u * Math.PI) * (rnd() * 2.2 - 1.1)]);
  }
  g.appendChild(el('path', { d: toBezier(pts, false, 1), class: 'mrg__arrow-ln' }));
  const tipx = len;
  g.appendChild(el('path', {
    d: `M${(tipx - 3.4).toFixed(1)} -1.8 L${tipx.toFixed(1)} 0 L${(tipx - 3.4).toFixed(1)} 1.9`,
    class: 'mrg__arrow-ln',
  }));
  g.setAttribute('transform', `rotate(${ang})`);
  return g;
}

/**
 * 组装。
 * @param isSea    海面判定
 * @param blocked  装饰禁区判定（SVG 坐标）
 */
export function buildMarginalia(isSea, blocked, px, py, { skipRoses = false, skipNotes = false } = {}) {
  const g = el('g', { class: 'mrg', 'aria-hidden': 'true' });
  const debug = typeof window !== 'undefined' && window.location.search.includes('debug');
  const onSea = makeSpotFinder(isSea, blocked);
  const onLand = makeSpotFinder(isSea, blocked, (x, y) => !isSea(x, y));

  const place = (finder, lon, la, need, node, what) => {
    const spot = finder(px(lon), py(la), need);
    if (!spot) {
      if (debug) console.warn(`[marginalia] ${what} @${lon},${la} 找不到 ${need} 单位空白，跳过`);
      return;
    }
    const prev = node.getAttribute('transform') || '';
    node.setAttribute('transform', `translate(${spot[0].toFixed(1)},${spot[1].toFixed(1)}) ${prev}`);
    g.appendChild(node);
  };

  /* ── 小风向标：空海里三处（navigation 类目） ── */
  if (!skipRoses) place(onSea, 11.0, 37.4, 22, smallRose(17, 331), '风玫瑰·西地中海');
  /* 爱琴海主体（19.5–27E / 37.5–41N）整块是航线密集区禁区，而且岛礁密布，
     20 单位的净水根本不存在。放到禁区南缘的克里特海 —— 仍属爱琴海域，
     水面成片，且不压任何站点与航线。 */
  if (!skipRoses) place(onSea, 25.7, 36.4, 15, smallRose(13, 977), '风玫瑰·克里特海');
  if (!skipRoses) place(onSea, 22.0, 33.6, 20, smallRose(15.5, 1451), '风玫瑰·利比亚海');

  /* ── 拉丁注记 ──
     海上关于航行、陆上关于未知。都是史料里真实出现过的措辞。

     这一批是「航海家在自己那份图上补写的批注」，不是图例：
     字要小、要斜、要压在水纹上，读第二眼才发现。所以一律走
     annotation() 的手写斜体 + 起伏基线，绝不用 UI 字体或方框。 */
  if (!skipNotes) place(onSea, 20.2, 32.9, 28, annotation('MARE·PERICVLOSVM', { size: 6.4, tilt: -2.2, key: 'mrg-a1' }), '注记·危险之海');
  if (!skipNotes) place(onSea, 25.6, 33.9, 22, annotation('VENTI·ADVERSI', { size: 6.0, tilt: 2.6, key: 'mrg-a2' }), '注记·逆风');
  /* 马耳他以南那片死白的外海：古代航路在这里离岸最远，海图上标「不确定的海」
     正是这种位置。实测净空 40 单位，一行 5.6 号字宽约 60 单位、半宽 30，放得下。 */
  if (!skipNotes) place(onSea, 13.7, 34.45, 22, annotation('MARE·INCERTVM', { size: 5.8, tilt: 1.9, key: 'mrg-a6' }), '注记·不确定之海');
  /* 西西里海峡的浅滩群（斯凯尔基滩一带）：地中海东西通道上最出名的一处暗礁区，
     海底至今躺着成片的古代沉船。实测净空 30 单位，这个词半宽 19，放得下。
     原先摆在 18.9E —— 那里紧挨着 20.2E 的 MARE·PERICVLOSVM，
     两个同源的拉丁词并排出现，像同一句话写了两遍。 */
  if (!skipNotes) place(onSea, 11.8, 35.7, 18, annotation('PERICVLVM', { size: 5.4, tilt: -2.8, key: 'mrg-a7' }), '注记·险');
  if (!skipNotes) place(onLand, 10.6, 33.6, 22, annotation('HIC·SVNT·LEONES', { size: 6.2, tilt: -1.8, key: 'mrg-a3' }), '注记·此处有狮');
  if (!skipNotes) place(onLand, 23.4, 42.3, 22, annotation('TERRA·INCOGNITA', { size: 6.2, tilt: -2.6, key: 'mrg-a4' }), '注记·未知之地');
  if (!skipNotes) place(onLand, 13.3, 32.62, 20, annotation('NONDVM·EXPLORATVM', { size: 5.4, tilt: 1.8, key: 'mrg-a5' }), '注记·尚未勘查');   /* 的黎波里塔尼亚以南的内陆 —— 18 世纪欧洲海图上真正的空白就在这里，
                                     不是安纳托利亚。原先的 28.0E 既出画框，又压在特洛伊那一簇地名上 */

  /* ── 修改痕迹与指示箭头 ── */
  if (!skipNotes) place(onSea, 12.4, 39.6, 15, correction('mrg-f1'), '修改痕迹·第勒尼安');
  if (!skipNotes) place(onLand, 24.2, 41.0, 13, correction('mrg-f2'), '修改痕迹·色雷斯');
  /* 原来放在 13.2,35.4，但那里整块落在 Landmark 主区禁区（12–22E / 34.5–37N）
     里，向外找 48 单位也出不去，只会稳定地被跳过。挪到撒丁岛以南的空海。 */
  if (!skipNotes) place(onSea, 11.9, 38.6, 13, arrow(15, 196, 613), '箭头·撒丁以南');
  if (!skipNotes) place(onSea, 24.2, 36.4, 13, arrow(13, -158, 907), '箭头·克里特东');

  return g;
}
