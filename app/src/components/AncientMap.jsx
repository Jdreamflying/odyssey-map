import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { engravePatterns, INK } from '../scenes/engraving.js';

gsap.registerPlugin(ScrollTrigger);

/* 十二站，与 odysseyScenes.js 的十二幕一一对应 */
const STATIONS = [
  { id: 'troy-war-begins',    numeral: 'I',    p: 0.04 },
  { id: 'greek-army-march',   numeral: 'II',   p: 0.12 },
  { id: 'fall-of-troy',       numeral: 'III',  p: 0.20 },
  { id: 'odysseus-departure', numeral: 'IV',   p: 0.29 },
  { id: 'storm-at-sea',       numeral: 'V',    p: 0.38 },
  { id: 'island-of-cyclops',  numeral: 'VI',   p: 0.47 },
  { id: 'poseidon-appears',   numeral: 'VII',  p: 0.56 },
  { id: 'sirens',             numeral: 'VIII', p: 0.64 },
  { id: 'underworld',         numeral: 'IX',   p: 0.72 },
  { id: 'scylla-charybdis',   numeral: 'X',    p: 0.81 },
  { id: 'return-to-ithaca',   numeral: 'XI',   p: 0.90 },
  { id: 'end-of-voyage',      numeral: 'XII',  p: 0.98 },
];

const ROUTE_D =
  'M245 28 C 230 38, 224 46, 216 52 C 196 68, 180 78, 150 96 ' +
  'C 128 110, 116 128, 108 142 C 100 156, 92 168, 84 178 ' +
  'C 70 180, 54 186, 34 188';

/**
 * 航程铜版小图：固定在右上角，随滚动缓慢绘制航线，
 * 一艘小船沿航线驶过十二站。当前幕的站标点亮并显示序号。
 */
export default function AncientMap({ active }) {
  const svgRef = useRef(null);
  const routeRef = useRef(null);
  const shipRef = useRef(null);
  const stationRefs = useRef([]);

  useEffect(() => {
    const svg = svgRef.current;
    const route = routeRef.current;
    const ship = shipRef.current;
    if (!svg || !route || !ship) return undefined;

    const total = route.getTotalLength();
    route.style.strokeDasharray = `${total}`;
    route.style.strokeDashoffset = `${total}`;

    // 六个站标按航线长度百分比落位
    stationRefs.current.forEach((g, i) => {
      const st = STATIONS[i];
      if (!g || !st) return;
      const pt = route.getPointAtLength(total * st.p);
      g.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
    });

    // 整页滚动进度 → 绘制航线 + 移动小船
    const proxy = { p: 0 };
    const tween = gsap.to(proxy, {
      p: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: () => {
          const p = proxy.p;
          route.style.strokeDashoffset = `${total * (1 - p)}`;
          const pos = total * p;
          const pt = route.getPointAtLength(pos);
          const pt2 = route.getPointAtLength(Math.min(pos + 2, total));
          const angle = (Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180) / Math.PI;
          ship.setAttribute(
            'transform',
            `translate(${pt.x}, ${pt.y}) rotate(${angle + 90})`
          );
          ship.style.opacity = p > 0.004 ? 1 : 0;
        },
      },
    });

    // 让页面总高稳定后再校准一次
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => {
      window.clearTimeout(t);
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <aside className="ancient-map" aria-hidden="true">
      <p className="ancient-map__title">THE VOYAGE · 航程</p>
      <div className="ancient-map__plate">
        <svg ref={svgRef} viewBox="0 0 300 210" xmlns="http://www.w3.org/2000/svg">
          <defs dangerouslySetInnerHTML={{ __html: engravePatterns() }} />
          {/* 海 */}
          <rect x="0" y="0" width="300" height="210" fill="url(#hatch-horiz)" opacity="0.08" />
          <g fill="none" stroke={INK} strokeWidth="0.8" opacity="0.35">
            <path d="M0 60 q 40 -8 80 0 q 40 8 80 0 q 40 -8 80 0 q 40 8 60 0" />
            <path d="M0 86 q 40 -8 80 0 q 40 8 80 0 q 40 -8 80 0 q 40 8 60 0" opacity="0.6" />
            <path d="M0 112 q 40 -8 80 0 q 40 8 80 0 q 40 -8 80 0 q 40 8 60 0" opacity="0.4" />
          </g>
          {/* 希腊陆地（左上） */}
          <path d="M0 0 H60 Q 44 34 74 50 Q 100 62 90 86 Q 80 104 48 112 Q 16 116 0 100 Z" fill="url(#hatch-diag)" opacity="0.5" stroke={INK} strokeWidth="1" />
          <path d="M0 0 H60 Q 44 34 74 50 Q 100 62 90 86 Q 80 104 48 112 Q 16 116 0 100 Z" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.7" />
          {/* 小亚细亚陆地（右上） */}
          <path d="M300 0 V64 Q 264 56 240 68 Q 218 82 224 106 Q 230 126 266 136 Q 300 142 300 122 Z" fill="url(#hatch-diag)" opacity="0.5" stroke={INK} strokeWidth="1" />
          <path d="M300 0 V64 Q 264 56 240 68 Q 218 82 224 106 Q 230 126 266 136 Q 300 142 300 122 Z" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.7" />
          {/* 独眼岛 */}
          <ellipse cx="112" cy="146" rx="14" ry="8" fill="url(#hatch-criss)" opacity="0.6" stroke={INK} strokeWidth="0.9" />
          {/* 航线 */}
          <path ref={routeRef} d={ROUTE_D} fill="none" stroke={INK} strokeWidth="1.1" strokeDasharray="1000" strokeDashoffset="1000" opacity="0.9" />
          {/* 十二站标：仅当前站显示外环与序号，其余为小墨点 */}
          {STATIONS.map((st, i) => {
            const on = st.id === active;
            return (
              <g
                key={st.numeral}
                ref={(el) => {
                  stationRefs.current[i] = el;
                }}
                className={`ancient-map__station${on ? ' is-on' : ''}`}
              >
                <circle r={on ? 3 : 1.7} fill={INK} opacity={on ? 1 : 0.55} />
                {on ? <circle r="6.4" fill="none" stroke={INK} strokeWidth="0.7" opacity="0.65" /> : null}
                {on ? (
                  <text x="9.5" y="-6" fontFamily="GFS Didot, serif" fontSize="9" fill={INK} letterSpacing="1">
                    {st.numeral}
                  </text>
                ) : null}
              </g>
            );
          })}
          {/* 小船 */}
          <g ref={shipRef} className="ancient-map__ship" style={{ opacity: 0 }}>
            <path
              d="M0 -7 q 5 3 5 8 q -2 4 -5 4 q -3 0 -5 -4 q 0 -5 5 -8 Z M0 -8 l0 -4"
              fill="none"
              stroke={INK}
              strokeWidth="1.1"
            />
          </g>
          {/* 罗盘 */}
          <g stroke={INK} strokeWidth="1" fill="none" opacity="0.6">
            <path d="M278 196 l4 -11 l4 11 l-4 1 Z" fill={INK} />
            <path d="M278 182 l4 11 l4 -11 z" fill="none" />
            <text x="282" y="212" fontFamily="GFS Didot, serif" fontSize="7" fill={INK} opacity="0.6">Ν</text>
          </g>
        </svg>
      </div>
      <p className="ancient-map__caption">Αἰγαῖον Πέλαγος</p>
    </aside>
  );
}
