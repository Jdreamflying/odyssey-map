import { engraveDefs, INK } from './engraving.js';

/* ── 酒色的海：一望无际的刻线波浪与孤独的船 ─────────────── */
const WAVES = (() => {
  const out = [];
  for (let i = 0; i < 11; i++) {
    const y = 360 + i * 38;
    const opacity = 0.55 - i * 0.035;
    out.push(
      `<path d="M0 ${y} q 40 -12 80 0 q 40 12 80 0 q 40 -12 80 0 q 40 12 80 0 q 40 -12 80 0 q 40 12 80 0 q 40 -12 80 0 q 40 12 80 0 q 40 -12 80 0 q 40 12 80 0 q 40 -12 80 0 q 40 12 80 0 q 40 -12 80 0 q 40 12 80 0 q 40 -12 80 0 q 40 12 80 0 q 40 -12 80 0 q 40 12 80 0" fill="none" stroke="${INK}" stroke-width="1.1" opacity="${opacity}"/>`
    );
  }
  return out.join('\n');
})();

const GULLS = `
  <g fill="none" stroke="${INK}" stroke-width="1.2" opacity="0.6">
    <path d="M300 210 l11 7 l11 -7"/>
    <path d="M360 180 l10 6 l10 -6"/>
    <path d="M270 160 l9 6 l9 -6" opacity="0.4"/>
    <path d="M1060 230 l10 6 l10 -6" opacity="0.45"/>
  </g>`;

const SHIP = `
  <!-- 奥德修斯的船 -->
  <g stroke="${INK}" fill="none" stroke-width="1.5">
    <!-- 船体 -->
    <path d="M700 478 q 36 -12 72 -6 q 48 8 82 -4 q 10 6 4 18 l-12 10 h-138 l-18 -10 q -6 -6 -2 -12 z" fill="url(#hatch-diag)" opacity="0.45"/>
    <path d="M700 478 q 36 -12 72 -6 q 48 8 82 -4 q 10 6 4 18 l-12 10 h-138 l-18 -10 q -6 -6 -2 -12 z"/>
    <!-- 船舷桨孔 -->
    <path d="M736 486 v10 M762 488 v10 M788 488 v10 M814 486 v10" stroke-width="1" opacity="0.7"/>
    <!-- 船首艏楼 -->
    <path d="M846 466 q 26 -10 44 -24 l-14 34 z" fill="url(#hatch-diag)" opacity="0.5"/>
    <path d="M846 466 q 26 -10 44 -24 l-14 34 z"/>
    <!-- 桅 -->
    <line x1="776" y1="472" x2="776" y2="300" stroke-width="1.8"/>
    <!-- 帆 -->
    <path d="M776 300 Q 828 344 820 402 Q 814 428 776 420 Q 738 408 734 368 Q 732 332 776 300 Z" fill="url(#hatch-horiz)" opacity="0.35"/>
    <path d="M776 300 Q 828 344 820 402 Q 814 428 776 420 Q 738 408 734 368 Q 732 332 776 300 Z"/>
    <path d="M776 300 Q 802 350 798 402 M776 420 Q 754 370 756 322" stroke-width="0.9" opacity="0.6"/>
    <!-- 缆 -->
    <path d="M776 300 L700 462 M776 300 L848 452" stroke-width="0.8" opacity="0.6"/>
  </g>`;

const BACKGROUND = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
  ${engraveDefs()}
  <!-- 天空排线 -->
  <path d="M0 0 H1400 V200 Q 1050 250 700 220 T 0 240 Z" fill="url(#hatch-horiz)" opacity="0.2"/>
  <!-- 低垂的太阳 -->
  <g stroke="${INK}" stroke-width="1.3" fill="none" opacity="0.8">
    <circle cx="1150" cy="320" r="38"/>
    <circle cx="1150" cy="320" r="38" fill="url(#hatch-diag)" opacity="0.4"/>
    <path d="M1090 320 h-26 M1112 268 l-18 -18 M1226 320 h26 M1204 268 l18 -18" stroke-width="1.4"/>
  </g>
  <!-- 云 -->
  <path d="M120 250 q 90 -16 180 0 q 70 -12 140 0" fill="none" stroke="${INK}" stroke-width="1" opacity="0.3"/>
  ${GULLS}
  <!-- 海平线 -->
  <path d="M0 336 H1400" stroke="${INK}" stroke-width="1.5" opacity="0.6"/>
  ${SHIP}
  <!-- 波浪 -->
  ${WAVES}
</svg>`;

/* ── 翻卷的浪头：卷曲的浪舌与飞沫 ───────────────────────── */
const FOAM_DOTS = (() => {
  const out = [];
  const pts = [
    [352, 330], [376, 348], [412, 356], [446, 370], [470, 392], [432, 402],
    [396, 396], [366, 384], [338, 368], [316, 388], [292, 410], [330, 420],
    [368, 432], [296, 452], [340, 462], [386, 456], [428, 434], [470, 424],
    [300, 480], [350, 492], [400, 486], [452, 470],
  ];
  pts.forEach(([x, y]) => {
    out.push(`<circle cx="${x}" cy="${y}" r="2.2" fill="${INK}" opacity="0.55"/>`);
  });
  return out.join('\n');
})();

const FOREGROUND = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
  ${engraveDefs()}
  <!-- 卷起的浪头 -->
  <g fill="none" stroke="${INK}" stroke-width="1.7">
    <path d="M0 800 C 70 620 220 520 352 330
             C 372 286 430 300 458 356
             C 486 412 430 462 362 474
             C 300 484 250 560 252 800 Z"
          fill="url(#hatch-diag)" opacity="0.4"/>
    <path d="M0 800 C 70 620 220 520 352 330
             C 372 286 430 300 458 356
             C 486 412 430 462 362 474
             C 300 484 250 560 252 800 Z"/>
  </g>
  <!-- 浪体排线 -->
  <g stroke="${INK}" stroke-width="1" opacity="0.4" fill="none">
    <path d="M60 740 q 40 -14 84 -8 q 50 4 92 -18"/>
    <path d="M150 660 q 44 -14 88 -8 q 50 6 96 -18"/>
    <path d="M240 580 q 40 -14 82 -8 q 40 6 78 -16"/>
  </g>
  <!-- 浪舌下的飞沫 -->
  ${FOAM_DOTS}
  <!-- 水花短线 -->
  <g stroke="${INK}" stroke-width="1.2" opacity="0.6" fill="none">
    <path d="M470 330 l20 -18 M486 348 l26 -12 M440 316 l14 -24 M512 372 l18 -8"/>
  </g>
  <!-- 漂流的残木 -->
  <g stroke="${INK}" stroke-width="1.4" fill="none" opacity="0.8">
    <path d="M980 690 q 30 -10 58 6 q 30 16 60 2"/>
    <path d="M980 690 q 30 -6 58 6 q 30 14 60 4" stroke-width="1" opacity="0.6"/>
    <path d="M1036 680 l10 24 M1064 688 l6 22" stroke-width="0.9" opacity="0.5"/>
  </g>
</svg>`;

export default {
  id: 'ocean',
  numeral: 'III',
  title: 'The Wine-Dark Sea',
  titleCn: '酒色的海 · 漂泊',
  time: '归途的第三年',
  epigraph: 'πολλὰ δ᾽ ὅ γ᾽ ἐν πόντῳ πάθεν ἄλγεα',
  epigraphCn: '他在海上历尽诸般苦难。',
  epigraphSource: '《奥德赛》卷一',
  text: [
    '风从西边海面起身，把归途拆成一万条陌生的航线。',
    '奥德修斯松开手，任海把他带去任何神明想要的地方。',
    '没有航线的航行，是一种最古老的虔诚。',
  ],
  background: {
    prompt:
      '一望无际的酒色大海，刻线波浪层层后退，一艘孤帆小船，低垂的太阳，海鸥，18世纪航海版画',
    art: BACKGROUND,
    camera: { x: -140, y: -16, scale: 1.08 },
  },
  foreground: {
    prompt: '翻卷着浪舌的巨浪迎面扑来，飞沫与残木，近景铜版画，细密排线',
    art: FOREGROUND,
    camera: { x: 60, y: 12, scale: 1.04 },
  },
  particles: { type: 'spray', count: 26 },
  map: { x: 38, name: '酒色的海 · 漂泊' },
};
