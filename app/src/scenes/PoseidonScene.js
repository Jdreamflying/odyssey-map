import { engraveDefs, INK } from './engraving.js';

/* ── 波塞冬的怒涛：风暴、三叉戟与升起的海神 ─────────────── */
const STORM_WAVES = (() => {
  const out = [];
  for (let i = 0; i < 8; i++) {
    const y = 420 + i * 48;
    const opacity = 0.5 - i * 0.045;
    out.push(
      `<path d="M0 ${y} q 46 -16 92 0 q 46 16 92 0 q 46 -16 92 0 q 46 16 92 0 q 46 -16 92 0 q 46 16 92 0 q 46 -16 92 0 q 46 16 92 0 q 46 -16 92 0 q 46 16 92 0 q 46 -16 92 0 q 46 16 92 0 q 46 -16 92 0 q 46 16 92 0 q 46 -16 92 0 q 46 16 92 0" fill="none" stroke="${INK}" stroke-width="1.2" opacity="${opacity}"/>`
    );
  }
  return out.join('\n');
})();

const TRIDENT = `
  <g stroke="${INK}" stroke-width="2" fill="none">
    <path d="M1092 470 L1152 120" stroke-width="3"/>
    <path d="M1152 120 V52" stroke-width="2.6"/>
    <path d="M1118 84 L1152 42 L1186 84" stroke-width="2.2"/>
    <path d="M1106 92 L1118 74 M1180 92 L1168 74" stroke-width="1.6"/>
    <path d="M1146 40 h12" stroke-width="2"/>
  </g>`;

const POSEIDON = `
  <g fill="none" stroke="${INK}" stroke-width="1.8">
    <!-- 从浪中升起的腰身 -->
    <path d="M880 640 Q 900 560 940 520 Q 1020 480 1100 520 Q 1200 560 1220 640 Z" fill="url(#hatch-diag)" opacity="0.5"/>
    <path d="M880 640 Q 900 560 940 520 Q 1020 480 1100 520 Q 1200 560 1220 640 Z"/>
    <!-- 胸腔 -->
    <path d="M960 520 Q 1020 470 1100 500 Q 1150 520 1148 560 Q 1100 540 1030 540 Q 966 540 960 520 Z" fill="url(#hatch-diag)" opacity="0.4"/>
    <path d="M960 520 Q 1020 470 1100 500 Q 1150 520 1148 560 Q 1100 540 1030 540 Q 966 540 960 520 Z"/>
    <path d="M1000 512 q 22 18 48 20" stroke-width="1.2" opacity="0.6"/>
    <!-- 左臂（抱在胸前） -->
    <path d="M960 520 Q 920 560 952 596 Q 1000 620 1050 600" stroke-width="1.6"/>
    <path d="M952 596 Q 990 610 1040 598" stroke-width="1.3" opacity="0.8"/>
    <!-- 右臂（举三叉戟） -->
    <path d="M1100 508 Q 1120 480 1092 470 Q 1070 462 1068 478" stroke-width="1.7"/>
    <!-- 颈 -->
    <path d="M1020 470 Q 1040 460 1060 470" stroke-width="1.4"/>
    <!-- 头：侧影 -->
    <path d="M1020 470 Q 1000 440 1014 402 Q 1020 386 1040 382 Q 1064 386 1072 410 Q 1078 436 1066 468" />
    <path d="M1020 470 Q 1000 440 1014 402 Q 1020 386 1040 382 Q 1064 386 1072 410 Q 1078 436 1066 468" fill="url(#hatch-diag)" opacity="0.4"/>
    <!-- 眉骨与怒目 -->
    <path d="M1036 398 Q 1052 392 1068 402" stroke-width="2.4"/>
    <circle cx="1050" cy="412" r="5.5" stroke-width="1.4"/>
    <circle cx="1051" cy="412" r="2" fill="${INK}"/>
    <!-- 鼻 -->
    <path d="M1054 416 L1058 434 Q 1054 440 1048 440" stroke-width="1.5"/>
    <!-- 须（排线大把） -->
    <path d="M1024 434 Q 1004 470 1010 512 Q 1018 542 1042 556 Q 1052 528 1040 500 Q 1058 512 1068 500 Q 1064 470 1052 452" fill="url(#hatch-diag)" opacity="0.55"/>
    <path d="M1024 434 Q 1004 470 1010 512 Q 1018 542 1042 556 Q 1052 528 1040 500 Q 1058 512 1068 500 Q 1064 470 1052 452"/>
    <!-- 乱发 -->
    <g stroke-width="1.5" opacity="0.9">
      <path d="M1020 400 Q 1006 380 1016 360"/>
      <path d="M1034 384 Q 1032 356 1048 344"/>
      <path d="M1052 382 Q 1062 358 1078 360"/>
      <path d="M1068 392 Q 1086 382 1100 394"/>
    </g>
  </g>`;

const BACKGROUND = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
  ${engraveDefs()}
  <!-- 风暴云（十字排线） -->
  <path d="M0 0 H1400 V180 Q 1050 250 700 210 T 0 240 Z" fill="url(#hatch-criss)" opacity="0.5"/>
  <path d="M0 0 H1400 V180 Q 1050 250 700 210 T 0 240 Z" fill="none" stroke="${INK}" stroke-width="1.3" opacity="0.7"/>
  <g fill="none" stroke="${INK}" stroke-width="1" opacity="0.4">
    <path d="M120 150 q 90 -18 180 0 q 70 -12 140 0"/>
    <path d="M820 168 q 90 -16 180 0 q 80 -12 150 0"/>
  </g>
  <!-- 闪电 -->
  <g stroke="${INK}" stroke-width="1.8" fill="none" opacity="0.9">
    <path d="M620 60 l44 66 l-34 8 l40 62 M686 118 l16 -14 M668 146 l14 -12"/>
    <path d="M600 84 l-12 10 M660 120 l-14 8" stroke-width="1"/>
  </g>
  ${POSEIDON}
  ${TRIDENT}
  <!-- 浪 -->
  ${STORM_WAVES}
  <!-- 浪花飞溅短线 -->
  <g stroke="${INK}" stroke-width="1.2" opacity="0.6" fill="none">
    <path d="M840 640 l-20 16 M852 660 l-26 12 M850 620 l-30 -8 M1180 660 l-14 -18 M1200 680 l-20 -10"/>
  </g>
</svg>`;

/* ── 风暴中翘起的船艏 ───────────────────────────────────── */
const FOREGROUND = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
  ${engraveDefs()}
  <!-- 船艏巨浪 -->
  <path d="M560 800 Q 560 680 640 640 Q 700 620 720 680 Q 730 720 720 800 Z" fill="url(#hatch-diag)" opacity="0.5"/>
  <!-- 翘起的船艏 -->
  <g stroke="${INK}" stroke-width="2.2" fill="none">
    <path d="M700 800 Q 780 700 940 640 Q 1080 590 1160 560 Q 1220 540 1280 520
             Q 1288 510 1280 502 Q 1272 496 1264 504
             Q 1200 524 1140 548 Q 1060 580 990 620 Q 900 668 830 720 Q 780 760 750 800 Z"
          fill="url(#hatch-diag)" opacity="0.55"/>
    <path d="M700 800 Q 780 700 940 640 Q 1080 590 1160 560 Q 1220 540 1280 520
             Q 1288 510 1280 502 Q 1272 496 1264 504
             Q 1200 524 1140 548 Q 1060 580 990 620 Q 900 668 830 720 Q 780 760 750 800 Z"/>
    <!-- 船艏卷尾 -->
    <path d="M1264 504 Q 1240 512 1230 500 Q 1222 490 1232 484" stroke-width="1.6"/>
    <!-- 弦板与装饰线 -->
    <path d="M980 634 q 60 -26 130 -50 q 70 -22 138 -46" stroke-width="1.2" opacity="0.7"/>
    <!-- 绞盘绳索 -->
    <path d="M1090 588 q 10 24 -8 40 M1130 572 q 8 22 -6 38" stroke-width="1" opacity="0.7"/>
  </g>
  <!-- 抱紧船艏的人形（奥德修斯） -->
  <g stroke="${INK}" stroke-width="1.7" fill="none">
    <path d="M1188 560 Q 1176 596 1192 632 Q 1204 668 1228 700" />
    <path d="M1188 560 Q 1176 596 1192 632 Q 1204 668 1228 700" fill="url(#hatch-diag)" opacity="0.4"/>
    <circle cx="1188" cy="556" r="10"/>
    <path d="M1176 600 q 20 6 38 -4 M1174 622 q 22 8 42 -2" stroke-width="1.2" opacity="0.8"/>
  </g>
  <!-- 飞沫 -->
  <g stroke="${INK}" stroke-width="1.2" opacity="0.65" fill="none">
    <path d="M1280 470 l24 -20 M1300 492 l30 -14 M1294 520 l26 -10 M1270 460 l12 -26"/>
  </g>
  <g fill="${INK}" opacity="0.5">
    <circle cx="1250" cy="450" r="2.4"/>
    <circle cx="1278" cy="468" r="2"/>
    <circle cx="1262" cy="492" r="2.4"/>
    <circle cx="1234" cy="478" r="2"/>
  </g>
</svg>`;

export default {
  id: 'poseidon',
  numeral: 'V',
  title: 'The Wrath of the Sea-God',
  titleCn: '波塞冬 · 撼地者的怒涛',
  time: '风暴，无处不在',
  epigraph: 'Ἐνοσίχθων',
  epigraphCn: '撼地者 · 波塞冬',
  epigraphSource: '《奥德赛》中他的称号',
  text: [
    '所有的债，最后都记在同一个名字上。',
    '波塞冬没有忘记那只被戳瞎的眼睛。',
    '于是，每一朵扑向奥德修斯的浪，都带着一个神的名字。',
  ],
  background: {
    prompt:
      '风暴中的海神波塞冬从巨浪中升起，高举三叉戟，乱发长须，闪电划破排线密布的风暴云，18世纪版画',
    art: BACKGROUND,
    camera: { x: -120, y: -20, scale: 1.09 },
  },
  foreground: {
    prompt: '风暴中高高翘起的船艏，卷曲的艏饰，抱紧船艏的人影，飞沫四溅，近景铜版画',
    art: FOREGROUND,
    camera: { x: 90, y: 0, scale: 1.02 },
  },
  particles: { type: 'rain', count: 34 },
  map: { x: 76, name: '风暴海 · 波塞冬的怒涛' },
};
