import { engraveDefs, INK, INK_SOFT } from './engraving.js';

/* ── 特洛伊城：暮色下的城墙、塔楼与远山 ───────────────────── */
const cren = (x, y, w, teeth = 26, gap = 24, h = 20) => {
  let d = `M${x} ${y} `;
  let cx = x;
  while (cx < x + w) {
    d += `h${teeth} v-${h} h${gap} v${h} `;
    cx += teeth + gap;
  }
  return d;
};

const BACKGROUND = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
  ${engraveDefs()}
  <!-- 暮色天光 -->
  <path d="M0 0 H1400 V150 Q 1050 200 700 165 T 0 185 Z" fill="url(#hatch-horiz)" opacity="0.32"/>
  <!-- 残月 -->
  <g stroke="${INK}" stroke-width="1.4" fill="none">
    <circle cx="1135" cy="118" r="32"/>
    <path d="M1118 90 A32 32 0 1 0 1135 150 A26 26 0 0 1 1118 90 Z" fill="url(#hatch-diag)" opacity="0.6"/>
  </g>
  <!-- 云带 -->
  <path d="M70 208 q 90 -16 180 0 q 70 -12 140 0" fill="none" stroke="${INK}" stroke-width="1.1" opacity="0.34"/>
  <path d="M930 232 q 96 -16 190 0 q 80 -12 150 0" fill="none" stroke="${INK}" stroke-width="1.1" opacity="0.3"/>
  <!-- 远山（伊达山，两重山脊） -->
  <path d="M0 470 L130 318 L225 412 L330 282 L450 400 L560 320 L680 430 L770 340 L900 455 L1000 372 L1140 468 L1400 430 V800 H0 Z" fill="url(#hatch-diag)" opacity="0.18"/>
  <path d="M0 470 L130 318 L225 412 L330 282 L450 400 L560 320 L680 430 L770 340 L900 455 L1000 372 L1140 468 L1400 430" fill="none" stroke="${INK}" stroke-width="1.1" opacity="0.45"/>
  <!-- 平原 -->
  <path d="M0 520 H1400 V800 H0 Z" fill="url(#hatch-horiz)" opacity="0.1"/>
  <path d="M0 520 H1400" fill="none" stroke="${INK}" stroke-width="1" opacity="0.25"/>
  <!-- 内墙（第二层） -->
  <g fill="none" stroke="${INK}" stroke-width="1" opacity="0.6">
    <path d="M300 436 H1120 V408 H300 Z" fill="url(#hatch-diag)" opacity="0.25"/>
    <path d="${cren(300, 408, 820, 24, 22, 16)}"/>
  </g>
  <!-- 外墙 -->
  <g fill="none" stroke="${INK}" stroke-width="1.4">
    <path d="M200 586 H1220 V430 H200 Z" fill="url(#hatch-diag)" opacity="0.42"/>
    <path d="${cren(200, 430, 1020)}"/>
  </g>
  <!-- 左塔楼 -->
  <g fill="none" stroke="${INK}" stroke-width="1.4">
    <path d="M200 586 H318 V372 H200 Z" fill="url(#hatch-diag)" opacity="0.5"/>
    <path d="${cren(200, 372, 118)}"/>
    <rect x="250" y="428" width="18" height="58" fill="url(#hatch-criss)" opacity="0.8"/>
  </g>
  <!-- 右塔楼 -->
  <g fill="none" stroke="${INK}" stroke-width="1.4">
    <path d="M1082 586 H1200 V372 H1082 Z" fill="url(#hatch-diag)" opacity="0.5"/>
    <path d="${cren(1082, 372, 118)}"/>
    <rect x="1132" y="428" width="18" height="58" fill="url(#hatch-criss)" opacity="0.8"/>
  </g>
  <!-- 城门：双扇 + 拱 -->
  <g fill="none" stroke="${INK}" stroke-width="1.4">
    <path d="M598 586 V492 A92 92 0 0 1 782 492 V586" fill="url(#hatch-criss)" opacity="0.7"/>
    <path d="M598 586 V492 A92 92 0 0 1 782 492 V586"/>
    <path d="M690 500 V586"/>
    <path d="M604 520 H690 M604 544 H690 M690 520 H776 M690 544 H776" stroke-width="1" opacity="0.6"/>
  </g>
  <!-- 城门上方的圆盾浮雕 -->
  <g fill="none" stroke="${INK}" stroke-width="1.1" opacity="0.7">
    <circle cx="690" cy="430" r="24"/>
    <circle cx="690" cy="430" r="15"/>
    <circle cx="690" cy="430" r="4" fill="${INK}"/>
  </g>
  <!-- 城下散落的碎石与断矛 -->
  <g fill="none" stroke="${INK}" stroke-width="1.2" opacity="0.6">
    <path d="M860 640 l30 -26 M890 640 l-30 -26"/>
    <path d="M980 650 h46 l-6 8 h-36 z"/>
    <circle cx="1250" cy="648" r="10"/>
    <circle cx="1250" cy="648" r="6" opacity="0.5"/>
    <path d="M260 660 h40 M276 656 v8"/>
  </g>
</svg>`;

/* ── 特洛伊木马：巨大的近景剪影 ─────────────────────────── */
const FOREGROUND = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
  ${engraveDefs()}
  <!-- 地面排线 -->
  <path d="M60 700 H1340 V800 H60 Z" fill="url(#hatch-horiz)" opacity="0.14"/>
  <path d="M60 700 H1340" stroke="${INK}" stroke-width="1.6" fill="none"/>
  <!-- 木马底座（四轮平台） -->
  <g fill="none" stroke="${INK}" stroke-width="1.4">
    <path d="M470 700 H1190" />
    <path d="M470 700 V712 H1190 V700" fill="url(#hatch-horiz)" opacity="0.35"/>
    <circle cx="560" cy="738" r="26"/>
    <circle cx="560" cy="738" r="13"/>
    <circle cx="560" cy="738" r="3" fill="${INK}"/>
    <circle cx="1100" cy="738" r="26"/>
    <circle cx="1100" cy="738" r="13"/>
    <circle cx="1100" cy="738" r="3" fill="${INK}"/>
  </g>
  <!-- 登马梯 -->
  <g stroke="${INK}" stroke-width="1.3" fill="none" opacity="0.8">
    <path d="M660 700 L640 480"/>
    <path d="M712 700 L704 480"/>
    <path d="M656 660 L700 660 M650 620 L694 620 M644 580 L688 580 M638 540 L682 540 M632 500 L676 500" stroke-width="1"/>
  </g>
  <!-- 木马主体 -->
  <g fill="none" stroke="${INK}" stroke-width="1.8">
    <!-- 后腿 -->
    <path d="M990 636 L990 700 M1020 636 L1020 700" stroke-width="2.4"/>
    <!-- 前腿 -->
    <path d="M640 630 L630 700 M678 630 L668 700" stroke-width="2.4"/>
    <!-- 腹部 -->
    <path d="M585 596 Q 900 612 1120 606"/>
    <!-- 背脊 -->
    <path d="M600 500 Q 880 486 1120 548"/>
    <!-- 后臀 -->
    <path d="M1120 548 Q 1150 585 1120 606"/>
    <!-- 胸肩 -->
    <path d="M600 500 Q 560 555 585 596"/>
    <!-- 颈 -->
    <path d="M618 512 Q 540 420 470 352"/>
    <!-- 喉 -->
    <path d="M585 596 Q 540 530 478 452"/>
    <!-- 头 -->
    <path d="M470 352 Q 436 376 424 430 Q 448 452 478 452"/>
    <!-- 口鼻 -->
    <path d="M424 430 L402 444 M424 438 L404 452" stroke-width="1.2"/>
    <!-- 耳 -->
    <path d="M474 352 L482 322 L496 340"/>
  </g>
  <!-- 鬃毛（排线） -->
  <path d="M486 362 Q 560 440 626 512 L 610 526 Q 545 452 476 376 Z" fill="url(#hatch-diag)" opacity="0.6" stroke="none"/>
  <path d="M476 376 Q 545 452 610 526" fill="none" stroke="${INK}" stroke-width="1.4"/>
  <!-- 眼 -->
  <circle cx="456" cy="406" r="6" fill="none" stroke="${INK}" stroke-width="1.6"/>
  <circle cx="458" cy="406" r="2.4" fill="${INK}"/>
  <!-- 肋骨排线 -->
  <g stroke="${INK}" stroke-width="1.1" opacity="0.55" fill="none">
    <path d="M720 522 Q 735 565 715 596"/>
    <path d="M800 530 Q 815 568 798 600"/>
    <path d="M880 538 Q 892 572 876 603"/>
    <path d="M960 543 Q 970 574 956 605"/>
  </g>
  <!-- 腹侧淡排线 -->
  <path d="M640 600 Q 900 612 1100 606" stroke="${INK}" stroke-width="1" opacity="0.3" fill="none"/>
  <!-- 尾 -->
  <g fill="none" stroke="${INK}" stroke-width="1.3">
    <path d="M1120 548 Q 1200 570 1188 660 Q 1172 700 1196 718"/>
    <path d="M1132 560 Q 1194 588 1184 664 Q 1172 700 1194 712" stroke-width="1" opacity="0.7"/>
  </g>
  <!-- 腹侧板缝 -->
  <path d="M560 700 Q 820 714 1080 700" stroke="${INK}" stroke-width="1.1" opacity="0.5" fill="none"/>
  <!-- 断矛与倒下的柱础 -->
  <g fill="none" stroke="${INK}" stroke-width="1.5">
    <path d="M240 700 L208 560 M256 700 L288 566" stroke-width="1.2"/>
    <path d="M300 700 q 20 -22 44 -20" stroke-width="1"/>
    <path d="M1230 700 V672 M1230 672 h14 M1244 672 V700" fill="url(#hatch-diag)" opacity="0.5"/>
  </g>
  <path d="M1230 700 V672 h14 V700" fill="none" stroke="${INK}" stroke-width="1.4"/>
</svg>`;

export default {
  id: 'troy',
  numeral: 'I',
  title: 'Troy',
  titleCn: '特洛伊 · 城破之夜',
  time: '公元前十二世纪',
  epigraph: 'ἄνδρα μοι ἔννεπε, Μοῦσα, πολύτροπον',
  epigraphCn: '缪斯，请歌唱那位辗转多方的人。',
  epigraphSource: '《奥德赛》卷一',
  text: [
    '十年围城将尽。城墙下，木马静立如一个不可言说的念头。',
    '今夜，阿开亚人将把神谕与火焰一同放进特洛伊的腹地。',
    '伊利昂，这座伟大的城，即将退入记忆。',
  ],
  background: {
    prompt:
      '暮色下的特洛伊城墙与塔楼，远山伊达山，残月，18世纪考古版画，铜版排线，单色墨线，仿古棕褐',
    art: BACKGROUND,
    camera: { x: 120, y: 0, scale: 1.07 },
  },
  foreground: {
    prompt:
      '巨大的特洛伊木马剪影立于底座之上，登马梯，断矛与柱础，版画风格，细密排线，近景',
    art: FOREGROUND,
    camera: { x: -70, y: 0, scale: 1.02 },
  },
  particles: { type: 'ash', count: 22 },
  map: { x: 8, name: '伊利昂 · 特洛伊' },
};
