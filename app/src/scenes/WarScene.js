import { engraveDefs, INK } from './engraving.js';

/* ── 特洛伊平原：滩头的战船与望不到头的军阵 ─────────────── */
const SPEARS = (() => {
  const out = [];
  for (let i = 0; i < 150; i++) {
    const col = i % 60;
    const row = Math.floor(i / 60);
    const x = 120 + col * 20;
    const y = 640 - row * 66;
    out.push(
      `<line x1="${x}" y1="${y}" x2="${x - 10}" y2="${y - 190}" stroke="${INK}" stroke-width="1.1" opacity="${0.28 + row * 0.18}"/>`
    );
  }
  return out.join('\n');
})();

const SHIELDS = (() => {
  const out = [];
  for (let i = 0; i < 26; i++) {
    const col = i % 13;
    const row = Math.floor(i / 13);
    const cx = 180 + col * 88 + row * 20;
    const cy = 690 - row * 60;
    const r = 24 - row * 4;
    out.push(
      `<g fill="none" stroke="${INK}" stroke-width="1.2" opacity="${0.5 - row * 0.16}">
        <circle cx="${cx}" cy="${cy}" r="${r}"/>
        <circle cx="${cx}" cy="${cy}" r="${r * 0.62}"/>
        <circle cx="${cx}" cy="${cy}" r="${r * 0.22}" fill="${INK}"/>
      </g>`
    );
  }
  return out.join('\n');
})();

const SHIPS = `
  <!-- 滩头战船 -->
  <g fill="none" stroke="${INK}" stroke-width="1.5" opacity="0.55">
    <path d="M60 610 q 60 -18 120 0 q 60 14 120 -2 q 46 -10 70 -4" />
    <path d="M300 606 l26 -30 q 40 6 60 22 l-40 8 z" fill="url(#hatch-diag)" opacity="0.4"/>
    <path d="M300 606 l26 -30 q 40 6 60 22 l-40 8 z"/>
  </g>
  <g fill="none" stroke="${INK}" stroke-width="1.5" opacity="0.4">
    <path d="M520 636 q 60 -16 120 0 q 60 14 120 -2 q 46 -10 70 -4" />
    <path d="M756 632 l26 -30 q 40 6 60 22 l-40 8 z" fill="url(#hatch-diag)" opacity="0.35"/>
    <path d="M756 632 l26 -30 q 40 6 60 22 l-40 8 z"/>
  </g>`;

const BACKGROUND = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
  ${engraveDefs()}
  <!-- 尘云压顶 -->
  <path d="M0 0 H1400 V110 Q 1100 150 700 130 T 0 150 Z" fill="url(#hatch-diag)" opacity="0.2"/>
  <path d="M120 90 q 90 -20 180 -4 q 60 -12 120 0" fill="none" stroke="${INK}" stroke-width="1" opacity="0.3"/>
  <path d="M900 100 q 90 -18 180 0 q 80 -10 140 2" fill="none" stroke="${INK}" stroke-width="1" opacity="0.3"/>
  <!-- 远岸 -->
  <path d="M0 470 Q 700 430 1400 460 V800 H0 Z" fill="url(#hatch-horiz)" opacity="0.12"/>
  <!-- 海面 -->
  <path d="M0 470 Q 700 430 1400 460 V540 H0 Z" fill="url(#hatch-wave)" opacity="0.4"/>
  <path d="M0 470 Q 700 430 1400 460" fill="none" stroke="${INK}" stroke-width="1.4" opacity="0.6"/>
  <!-- 滩涂 -->
  <path d="M0 540 H1400 V800 H0 Z" fill="url(#hatch-horiz)" opacity="0.12"/>
  <path d="M0 540 H1400" fill="none" stroke="${INK}" stroke-width="1.2" opacity="0.5"/>
  ${SHIPS}
  <!-- 军阵：盾列 -->
  ${SHIELDS}
  <!-- 军阵：矛林 -->
  ${SPEARS}
  <!-- 营火残烟 -->
  <g fill="none" stroke="${INK}" stroke-width="1" opacity="0.4">
    <path d="M1240 640 q 8 -30 2 -60 q -6 -30 4 -54"/>
    <path d="M1258 646 q -2 -34 -12 -58" opacity="0.3"/>
  </g>
</svg>`;

/* ── 重装步兵：背影，盾上刻着戈耳工 ─────────────────────── */
const FOREGROUND = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
  ${engraveDefs()}
  <!-- 地面 -->
  <path d="M60 700 H1340 V800 H60 Z" fill="url(#hatch-horiz)" opacity="0.15"/>
  <path d="M60 700 H1340" stroke="${INK}" stroke-width="1.6" fill="none"/>
  <!-- 圆盾 -->
  <g fill="none" stroke="${INK}" stroke-width="1.7">
    <circle cx="850" cy="470" r="172"/>
    <circle cx="850" cy="470" r="142"/>
    <circle cx="850" cy="470" r="110"/>
    <circle cx="850" cy="470" r="44" fill="url(#hatch-diag)" opacity="0.5"/>
  </g>
  <!-- 盾上戈耳工（抽象刻线） -->
  <g stroke="${INK}" stroke-width="1.3" fill="none" opacity="0.85">
    <path d="M790 470 h120"/>
    <circle cx="850" cy="452" r="10"/>
    <circle cx="850" cy="488" r="10"/>
    <circle cx="822" cy="470" r="6"/>
    <circle cx="878" cy="470" r="6"/>
    <path d="M850 470 l-22 14 M850 470 l22 14"/>
  </g>
  <!-- 头与头盔 -->
  <g fill="none" stroke="${INK}" stroke-width="1.6">
    <path d="M640 700 V560 q 0 -80 66 -96 q 66 16 66 96 V700"/>
    <path d="M706 464 q 6 -30 36 -30 q 30 0 36 30" fill="none" stroke-width="1.3"/>
    <rect x="688" y="470" width="108" height="34" fill="url(#hatch-horiz)" opacity="0.4"/>
  </g>
  <!-- 头盔马鬃冠 -->
  <path d="M706 468 Q 742 428 778 468 M778 468 q 12 -6 24 0" fill="none" stroke="${INK}" stroke-width="1.8"/>
  <path d="M706 468 Q 742 434 778 468" fill="url(#hatch-diag)" opacity="0.55"/>
  <!-- 双臂 -->
  <g fill="none" stroke="${INK}" stroke-width="1.5">
    <path d="M760 560 Q 812 600 848 640"/>
    <path d="M950 560 Q 1012 596 1036 660"/>
  </g>
  <!-- 长矛（穿过画面） -->
  <path d="M520 700 L1020 240" stroke="${INK}" stroke-width="2.2"/>
  <path d="M520 700 L1020 240" stroke="${INK}" stroke-width="5" opacity="0.12"/>
  <path d="M1008 258 l22 -14 M1018 244 l-14 24" stroke="${INK}" stroke-width="1.6"/>
  <!-- 腿甲 -->
  <g fill="none" stroke="${INK}" stroke-width="1.4">
    <path d="M656 700 V604 M644 700 V612" stroke-width="1"/>
    <path d="M668 640 L640 640 M672 618 L644 618" stroke-width="1"/>
    <path d="M756 700 V604 M744 700 V612" stroke-width="1"/>
    <path d="M768 640 L740 640 M772 618 L744 618" stroke-width="1"/>
  </g>
  <!-- 脚边盔缨 -->
  <g fill="none" stroke="${INK}" stroke-width="1.2" opacity="0.7">
    <path d="M600 700 q 8 -18 20 -16 q 6 -14 18 -10"/>
    <path d="M1080 700 q 6 -16 16 -14 q 8 -12 18 -6"/>
  </g>
</svg>`;

export default {
  id: 'war',
  numeral: 'II',
  title: 'The Ten Years',
  titleCn: '十年 · 滩头的军阵',
  time: '围城十年',
  epigraph: 'Τροίης ἱερὸν πτολίεθρον ἔπερσε',
  epigraphCn: '他荡平了特洛伊的神圣城。',
  epigraphSource: '《奥德赛》卷一',
  text: [
    '十年。父亲在滩头晒成枯骨，儿子在营帐里学会了磨枪。',
    '船被拖上岸，缆索被海盐漂成白色。',
    '战争，是特洛伊城外一片望不到头、被反复命名的荒芜。',
  ],
  background: {
    prompt:
      '特洛伊滩头的战船与望不到头的军阵，矛林盾列，营火残烟，18世纪考古版画，铜版排线，单色墨线',
    art: BACKGROUND,
    camera: { x: -130, y: 0, scale: 1.07 },
  },
  foreground: {
    prompt:
      '重装步兵的背影，圆盾上刻着戈耳工，长矛斜穿画面，头盔马鬃冠，近景版画',
    art: FOREGROUND,
    camera: { x: 80, y: 0, scale: 1.0 },
  },
  particles: { type: 'dust', count: 20 },
  map: { x: 20, name: '特洛伊平原 · 阿开亚军营' },
};
