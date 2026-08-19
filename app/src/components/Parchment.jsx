import { useEffect, useMemo, useState } from 'react';
import { ASSETS, assetUrl } from '../data/cinema.js';

/* 极淡的手稿痕迹：《奥德赛》开篇。只作为纸面的历史感，不供阅读。 */
const SCRIPT_LINES = [
  'ἄνδρα μοι ἔννεπε, Μοῦσα, πολύτροπον, ὃς μάλα πολλὰ',
  'πλάγχθη, ἐπεὶ Τροίης ἱερὸν πτολίεθρον ἔπερσεν·',
  'πολλῶν δ᾽ ἀνθρώπων ἴδεν ἄστεα καὶ νόον ἔγνω,',
  'πολλὰ δ᾽ ὅ γ᾽ ἐν πόντῳ πάθεν ἄλγεα ὃν κατὰ θυμόν,',
  'ἀρνύμενος ἥν τε ψυχὴν καὶ νόστον ἑταίρων.',
  'ἀλλ᾽ οὐδ᾽ ὣς ἑτάρους ἐρρύσατο, ἱέμενός περ·',
  'αὐτῶν γὰρ σφετέρῃσιν ἀτασθαλίῃσιν ὄλοντο,',
  'νήπιοι, οἳ κατὰ βοῦς Ὑπερίονος Ἠελίοιο',
];

/**
 * 一张老羊皮纸。卷起转场需要两张（序幕一张、地图一张），故做成组件。
 *
 * 层次自下而上：
 *   base    底色与深浅不均
 *   fiber   粗糙纸纤维
 *   stain   老化污渍
 *   photo   真实纹理（textures/parchment-master.jpg，缺失则整层不渲染）
 *   script  极淡的古希腊手稿痕迹（独立文本层，非烧死在图里）
 *   ink     零星墨迹
 *   crease  折痕
 *   burn    局部烧焦
 *   holes   少量孔洞与缺角
 *   grain   颗粒噪点
 *   edge    边缘磨损、暗角、厚度与轻微卷曲
 *
 * 全部克制 —— 目标是十八世纪图录用纸，不是海盗藏宝图。
 */
export default function Parchment({ variant = 'cinema', script = true, seed = 1 }) {
  const [hasTexture, setHasTexture] = useState(false);

  /* 真实纹理存在才渲染该层；不存在静默跳过，绝不报错 */
  useEffect(() => {
    const img = new Image();
    img.onload = () => setHasTexture(true);
    img.onerror = () => setHasTexture(false);
    img.src = assetUrl(variant === 'map' ? ASSETS.parchmentMap : ASSETS.parchmentCinema);
    return () => { img.onload = null; img.onerror = null; };
  }, [variant]);

  const holes = useMemo(() => {
    const rnd = mulberry(seed * 977);
    return Array.from({ length: 5 }, () => ({
      left: 4 + rnd() * 92,
      top: 6 + rnd() * 88,
      size: 2 + rnd() * 5,
      blur: 1 + rnd() * 2,
    }));
  }, [seed]);

  return (
    <div className={`pmt pmt--${variant}`} aria-hidden="true" data-texture={hasTexture ? 'on' : 'off'}>
      <div className="pmt__base" />
      <div className="pmt__fiber" />
      <div className="pmt__stain" />
      {hasTexture ? (
        <div
          className="pmt__photo"
          style={{ backgroundImage: `url(${assetUrl(variant === 'map' ? ASSETS.parchmentMap : ASSETS.parchmentCinema)})` }}
        />
      ) : null}

      {script ? (
        <div className="pmt__script">
          {SCRIPT_LINES.map((l, i) => (
            <p key={i} style={{ opacity: 0.032 + (i % 3) * 0.018 }}>{l}</p>
          ))}
        </div>
      ) : null}

      <div className="pmt__ink" />
      <div className="pmt__crease" />
      {variant === 'cinema' ? <div className="pmt__burn" /> : null}

      <div className="pmt__holes">
        {(variant === 'cinema' ? holes : []).map((h, i) => (
          <span
            key={i}
            style={{
              left: `${h.left}%`,
              top: `${h.top}%`,
              width: `${h.size}px`,
              height: `${h.size * 0.8}px`,
              filter: `blur(${h.blur}px)`,
            }}
          />
        ))}
      </div>

      <div className="pmt__grain" />
      <div className="pmt__edge" />
      <div className="pmt__curl" />
    </div>
  );
}

/* 小型确定性随机，保证孔洞位置每次刷新一致 */
function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
