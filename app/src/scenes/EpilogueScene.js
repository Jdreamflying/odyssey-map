import { engraveDefs, INK } from './engraving.js';

/* ── 伊萨卡：平静的海、橄榄树与晨光 ─────────────────────── */
const OLIVE_CANOPY = (() => {
  const blobs = [
    [720, 300, 130, 110], [560, 330, 120, 100], [880, 310, 120, 100],
    [620, 210, 110, 90], [820, 200, 120, 95], [730, 150, 90, 75],
    [560, 240, 90, 75], [920, 240, 95, 78], [700, 90, 70, 55],
  ];
  return blobs
    .map(
      ([x, y, w, h], i) =>
        `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="url(#hatch-diag)" opacity="${0.3 + (i % 3) * 0.1}"/>
         <ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="none" stroke="${INK}" stroke-width="1.2" opacity="0.65"/>`
    )
    .join('\n');
})();

const BACKGROUND = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
  ${engraveDefs()}
  <!-- 拂晓天光 -->
  <path d="M0 0 H1400 V170 Q 1050 210 700 180 T 0 205 Z" fill="url(#hatch-horiz)" opacity="0.16"/>
  <g stroke="${INK}" stroke-width="1.3" fill="none" opacity="0.7">
    <circle cx="260" cy="180" r="30"/>
    <circle cx="260" cy="180" r="30" fill="url(#hatch-diag)" opacity="0.35"/>
    <path d="M200 180 h-26 M222 128 l-18 -18 M314 180 h26 M314 128 l18 -18" stroke-width="1.3"/>
  </g>
  <!-- 伊萨卡岛 -->
  <path d="M200 470 Q 400 380 620 420 Q 800 452 950 420 Q 1140 378 1280 450 L1300 800 H200 Z" fill="url(#hatch-diag)" opacity="0.2"/>
  <path d="M200 470 Q 400 380 620 420 Q 800 452 950 420 Q 1140 378 1280 450 L1300 800 H200 Z" fill="none" stroke="${INK}" stroke-width="1.3" opacity="0.7"/>
  <!-- 岛上山峦 -->
  <path d="M520 430 L660 340 L760 420 L900 352 L1040 430" fill="none" stroke="${INK}" stroke-width="1.1" opacity="0.5"/>
  <!-- 海面 -->
  <path d="M0 470 H1400 V800 H0 Z" fill="url(#hatch-wave)" opacity="0.3"/>
  <path d="M0 520 q 60 -10 120 0 q 60 10 120 0 q 60 -10 120 0 q 60 10 120 0 q 60 -10 120 0 q 60 10 120 0 q 60 -10 120 0 q 60 10 120 0 q 60 -10 120 0 q 60 10 120 0 q 60 -10 120 0 q 60 10 120 0" fill="none" stroke="${INK}" stroke-width="1.1" opacity="0.5"/>
  <path d="M0 560 q 60 -10 120 0 q 60 10 120 0 q 60 -10 120 0 q 60 10 120 0 q 60 -10 120 0 q 60 10 120 0 q 60 -10 120 0 q 60 10 120 0 q 60 -10 120 0 q 60 10 120 0 q 60 -10 120 0 q 60 10 120 0" fill="none" stroke="${INK}" stroke-width="1.1" opacity="0.45"/>
  <!-- 王宫门廊 -->
  <g stroke="${INK}" stroke-width="1.3" fill="none" opacity="0.75">
    <path d="M420 420 V300 M520 420 V300 M620 420 V300 M720 420 V300" stroke-width="1.6"/>
    <path d="M390 300 H750" stroke-width="1.8"/>
    <path d="M390 300 Q 570 260 750 300" opacity="0.6"/>
    <path d="M400 420 H740" stroke-width="1.4"/>
    <path d="M470 420 V360 h100 V420" stroke-width="1.4"/>
  </g>
  <!-- 晨鸟 -->
  <g stroke="${INK}" stroke-width="1.1" fill="none" opacity="0.55">
    <path d="M1030 180 l10 6 l10 -6"/>
    <path d="M1100 205 l9 6 l9 -6" opacity="0.4"/>
  </g>
</svg>`;

/* ── 橄榄树：树干里凿着床柱 ─────────────────────────────── */
const FOREGROUND = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
  ${engraveDefs()}
  <!-- 地面 -->
  <path d="M60 680 H1340 V800 H60 Z" fill="url(#hatch-horiz)" opacity="0.12"/>
  <path d="M60 680 H1340" stroke="${INK}" stroke-width="1.6" fill="none"/>
  <!-- 橄榄树干（两股交缠） -->
  <g fill="none" stroke="${INK}" stroke-width="1.8">
    <path d="M660 680 Q 640 560 668 470 Q 690 400 660 330" stroke-width="2.4"/>
    <path d="M760 680 Q 800 570 776 470 Q 758 400 788 330" stroke-width="2.4"/>
    <path d="M668 470 Q 700 440 730 430 Q 706 490 680 512" stroke-width="1.6" opacity="0.9"/>
    <path d="M776 470 Q 742 448 712 442" stroke-width="1.6" opacity="0.9"/>
  </g>
  <!-- 枝干 -->
  <g stroke="${INK}" stroke-width="1.2" fill="none">
    <path d="M668 470 Q 620 440 570 448 M668 470 Q 630 470 596 492 M660 330 Q 620 290 580 270 M660 330 Q 700 260 748 240 M788 330 Q 840 300 900 300 M788 330 Q 830 370 880 386 M700 400 Q 660 390 620 398 M740 420 Q 780 440 820 440"/>
  </g>
  <!-- 树冠 -->
  ${OLIVE_CANOPY}
  <!-- 树干上凿出的床柱示意（横线） -->
  <g stroke="${INK}" stroke-width="1.2" opacity="0.7" fill="none">
    <path d="M646 520 h30 M648 540 h34 M650 560 h34 M654 580 h30" stroke-width="1.1"/>
  </g>
  <!-- 树下小祭坛与油灯 -->
  <g stroke="${INK}" stroke-width="1.3" fill="none">
    <path d="M1010 680 V620 H1090 V680" />
    <path d="M1020 620 H1080 M1030 600 H1070" stroke-width="1"/>
    <path d="M1050 620 q 4 -10 12 -6 q 6 3 2 10" stroke-width="1.1" opacity="0.8"/>
  </g>
  <!-- 一顶放下的盔与矛 -->
  <g stroke="${INK}" stroke-width="1.4" fill="none" opacity="0.85">
    <path d="M520 680 Q 540 648 578 644 Q 604 644 608 668 Q 610 680 600 680 Z" fill="url(#hatch-diag)" opacity="0.5"/>
    <path d="M520 680 Q 540 648 578 644 Q 604 644 608 668 Q 610 680 600 680 Z"/>
    <path d="M556 648 q 6 -24 26 -22 q 16 2 14 20" stroke-width="1"/>
    <path d="M486 680 L470 560 M516 680 L520 566" stroke-width="1.2"/>
  </g>
</svg>`;

export default {
  id: 'epilogue',
  numeral: 'VI',
  title: 'Ithaca',
  titleCn: '伊萨卡 · 归途的终点',
  time: '第二十个年头',
  epigraph: 'Ἰθάκη',
  epigraphCn: '伊萨卡',
  epigraphSource: '《奥德赛》卷十三',
  text: [
    '奥德修斯终于回到伊萨卡，老得只剩下一个名字。',
    '他把名字埋进那棵橄榄树——树干里，是亲手凿出的床柱。',
    '漫长的漂流结束了。长卷的另一端，原来是家。',
  ],
  background: {
    prompt:
      '拂晓的伊萨卡岛，平静的海面，王宫门廊，晨光中的橄榄树，18世纪考古版画，铜版排线，静谧',
    art: BACKGROUND,
    camera: { x: 60, y: 0, scale: 1.04 },
  },
  foreground: {
    prompt: '树干交缠的古老橄榄树，树下的祭坛与放下的盔矛，安宁的归家景象，近景铜版画',
    art: FOREGROUND,
    camera: { x: -40, y: 0, scale: 1.0 },
  },
  particles: { type: 'leaf', count: 12 },
  map: { x: 96, name: '伊萨卡 · 归途终点' },
};
