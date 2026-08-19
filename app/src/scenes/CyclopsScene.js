import { engraveDefs, INK } from './engraving.js';

/* ── 库克罗普斯的山洞：悬垂的钟乳石与独眼巨人 ───────────── */
const STALACTITES = (() => {
  const out = [];
  for (let i = 0; i < 18; i++) {
    const x = i * 78;
    const len = 46 + (i % 6) * 26;
    out.push(
      `<path d="M${x} 0 L${x + 36} 0 L${x + 18} ${len} Z" fill="url(#hatch-diag)" opacity="${0.35 + (i % 3) * 0.12}"/>`
    );
  }
  return out.join('\n');
})();

const CAVE_EDGE_LEFT = `
  <path d="M0 0 H120 V120 Q 90 300 40 520 Q 10 660 0 800 L0 0 Z" fill="url(#hatch-diag)" opacity="0.7"/>`;

const CAVE_EDGE_RIGHT = `
  <path d="M1400 0 H1260 V90 Q 1310 320 1330 560 Q 1350 700 1340 800 H1400 Z" fill="url(#hatch-criss)" opacity="0.8"/>`;

const BACKGROUND = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
  ${engraveDefs()}
  <!-- 洞顶岩层 -->
  ${STALACTITES}
  <path d="M0 0 H1400 V70 Q 1300 90 700 80 T 0 95 Z" fill="url(#hatch-criss)" opacity="0.5"/>
  ${CAVE_EDGE_LEFT}
  ${CAVE_EDGE_RIGHT}
  <!-- 洞壁深处的火 -->
  <g stroke="${INK}" stroke-width="1.3" fill="none" opacity="0.6">
    <path d="M680 560 Q 700 520 692 470 Q 686 440 706 420 M700 560 Q 718 512 706 466 Q 700 430 718 414 M694 470 Q 706 448 726 440" opacity="0.5"/>
    <path d="M668 560 h80 M664 590 h88" stroke-width="1" opacity="0.4"/>
  </g>
  <!-- 独眼巨人 -->
  <g fill="none" stroke="${INK}" stroke-width="1.8">
    <!-- 躯干 -->
    <path d="M960 700 Q 940 560 972 480 Q 1040 420 1140 470 Q 1260 520 1290 700 Z" fill="url(#hatch-diag)" opacity="0.5"/>
    <path d="M960 700 Q 940 560 972 480 Q 1040 420 1140 470 Q 1260 520 1290 700 Z"/>
    <!-- 胸膛肌肉排线 -->
    <path d="M1030 500 Q 1070 520 1110 500" stroke-width="1.2" opacity="0.6"/>
    <path d="M1044 528 Q 1084 546 1124 528" stroke-width="1.2" opacity="0.6"/>
    <!-- 颈与头 -->
    <path d="M1000 480 Q 1000 400 1008 350 Q 1040 300 1100 314 Q 1160 330 1154 440" />
    <path d="M1000 480 Q 1000 400 1008 350 Q 1040 300 1100 314 Q 1160 330 1154 440" fill="url(#hatch-diag)" opacity="0.4"/>
    <!-- 乱发 -->
    <g stroke-width="1.4" opacity="0.85">
      <path d="M1008 350 Q 990 330 1002 300"/>
      <path d="M1030 322 Q 1024 296 1042 284"/>
      <path d="M1062 306 Q 1068 280 1086 280"/>
      <path d="M1100 314 Q 1124 300 1140 316"/>
    </g>
    <!-- 独眼 -->
    <circle cx="1080" cy="372" r="15" stroke-width="1.6"/>
    <circle cx="1080" cy="372" r="7" fill="${INK}"/>
    <path d="M1048 362 Q 1080 340 1112 362" stroke-width="2.2"/>
    <!-- 鼻 -->
    <path d="M1080 388 L1094 424 Q 1090 434 1082 432" stroke-width="1.6"/>
    <!-- 口（张着，露出齿） -->
    <path d="M1044 452 Q 1080 468 1116 452" stroke-width="1.8"/>
    <path d="M1050 454 L1052 466 M1062 456 L1064 468 M1074 458 L1076 469 M1086 459 L1086 469 M1098 458 L1096 468 M1108 456 L1104 466" stroke-width="1" opacity="0.8"/>
    <!-- 抬起的拳头抵着下巴 -->
    <path d="M1086 470 Q 1100 500 1084 520" stroke-width="1.5"/>
    <path d="M1064 508 Q 1088 512 1100 500 Q 1116 490 1124 498" stroke-width="1.5"/>
    <!-- 被褥般的兽皮 -->
    <path d="M1010 640 Q 1080 610 1150 640 L 1160 700 L 1000 700 Z" fill="url(#hatch-horiz)" opacity="0.4"/>
  </g>
  <!-- 洞底兽骨 -->
  <g stroke="${INK}" stroke-width="1.3" fill="none" opacity="0.6">
    <path d="M560 700 h70 M584 700 l8 -20 M628 700 l-6 -22"/>
    <path d="M430 706 q 20 -16 44 -12"/>
  </g>
</svg>`;

/* ── 洞口封石：滚来的巨石、酒坛与橄榄木棍 ───────────────── */
const BOULDER = `
  <g fill="none" stroke="${INK}" stroke-width="1.7">
    <path d="M430 560 Q 600 440 760 520 Q 900 580 856 720 Q 820 800 620 800 L 470 800 Q 380 780 380 700 Q 384 620 430 560 Z" fill="url(#hatch-criss)" opacity="0.55"/>
    <path d="M430 560 Q 600 440 760 520 Q 900 580 856 720 Q 820 800 620 800 L 470 800 Q 380 780 380 700 Q 384 620 430 560 Z"/>
    <!-- 裂隙 -->
    <path d="M540 520 q 20 40 4 84 q -16 44 8 84" stroke-width="1.2" opacity="0.8"/>
    <path d="M700 480 q -6 60 22 108" stroke-width="1.1" opacity="0.6"/>
    <path d="M460 700 q 46 16 92 4" stroke-width="1.1" opacity="0.7"/>
  </g>`;

const AMPHORA = `
  <g stroke="${INK}" stroke-width="1.5" fill="none">
    <!-- 瓶身 -->
    <path d="M806 738 Q 806 692 828 692 Q 850 692 850 738 Q 850 784 828 784 Q 806 784 806 738 Z" fill="url(#hatch-diag)" opacity="0.4"/>
    <path d="M806 738 Q 806 692 828 692 Q 850 692 850 738 Q 850 784 828 784 Q 806 784 806 738 Z"/>
    <!-- 瓶颈 -->
    <path d="M812 692 V660 h32 V692"/>
    <!-- 双耳 -->
    <path d="M812 690 Q 782 690 782 722 M812 696 Q 788 700 788 726" stroke-width="1.1" opacity="0.85"/>
    <path d="M844 690 Q 874 690 874 722 M844 696 Q 868 700 868 726" stroke-width="1.1" opacity="0.85"/>
    <!-- 口沿 -->
    <path d="M806 660 h44" stroke-width="2"/>
    <path d="M810 652 h36" stroke-width="1.2"/>
    <!-- 腹部纹带 -->
    <path d="M810 726 h36 M810 750 h36" stroke-width="0.9" opacity="0.6"/>
  </g>`;

const FOREGROUND = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
  ${engraveDefs()}
  <!-- 地面 -->
  <path d="M0 720 H1400 V800 H0 Z" fill="url(#hatch-horiz)" opacity="0.16"/>
  <path d="M0 720 H1400" stroke="${INK}" stroke-width="1.6" fill="none"/>
  ${BOULDER}
  ${AMPHORA}
  <!-- 橄榄木棍（巨人的权杖） -->
  <g fill="none" stroke="${INK}" stroke-width="2">
    <path d="M1280 800 Q 1160 680 1030 560 Q 980 510 966 460" stroke-width="1.6"/>
    <path d="M1200 736 q 12 18 30 16" stroke-width="1.1"/>
    <path d="M1120 668 q 12 18 30 16" stroke-width="1.1"/>
    <path d="M1034 562 q 12 18 30 16" stroke-width="1.1"/>
    <path d="M966 460 l-30 -30" stroke-width="2.4"/>
    <path d="M936 430 q 8 14 0 24" stroke-width="2.2"/>
  </g>
  <!-- 酒洒出的短线 -->
  <g stroke="${INK}" stroke-width="1.1" opacity="0.7" fill="none">
    <path d="M880 668 l14 -16 M872 682 l18 -12"/>
  </g>
</svg>`;

export default {
  id: 'cyclops',
  numeral: 'IV',
  title: 'The One-Eyed Giant',
  titleCn: '独眼巨人 · 无人',
  time: '归途的第五年',
  epigraph: 'Οὖτίς μοι ὄνομα',
  epigraphCn: '我的名字，叫「无人」。',
  epigraphSource: '《奥德赛》卷九',
  text: [
    '在独眼巨人的山洞里，文明与蛮荒只隔一杯烈酒。',
    '他问，你是谁。他说，我是「无人」。',
    '于是，当瞎眼的巨人站在谷口呼喊，整个爱琴海都假装没有听见。',
  ],
  background: {
    prompt:
      '幽深的独眼巨人山洞，悬垂钟乳石，中央独眼的巨人，洞中火光，兽骨，18世纪考古版画，铜版排线',
    art: BACKGROUND,
    camera: { x: -90, y: 0, scale: 1.09 },
  },
  foreground: {
    prompt: '滚来的洞口巨石，倾倒的酒坛，巨人的橄榄木棍，近景铜版画，细密排线',
    art: FOREGROUND,
    camera: { x: 70, y: 0, scale: 1.02 },
  },
  particles: { type: 'dust', count: 18 },
  map: { x: 58, name: '库克罗普斯之岛 · 洞穴' },
};
