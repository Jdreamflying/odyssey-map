import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import OdysseyScene from './OdysseyScene.jsx';
import OdysseyMap from './OdysseyMap.jsx';
import Parchment from './Parchment.jsx';
import { ODYSSEY_SCENES } from '../data/odysseyScenes.js';
import { enterOf, exitOf, CLIP_EXITS } from '../experience/transitions.js';
import {
  CINEMA_CUES, TOTAL_DURATION, EPIC_DURATION, ROLL,
  ITHAKA_TEXT, PROLOGUE_TEXT, VOLUME_MARKS, ASSETS, assetUrl,
} from '../data/cinema.js';

/**
 * ════════════════════════════════════════════════════════════════
 *  史诗序幕 —— 时间驱动的单一 GSAP 时间轴
 * ════════════════════════════════════════════════════════════════
 *
 *  本轮的根本改动：时间轴不再由滚动位置驱动，而由 cinema clock 驱动。
 *  原因是 12 秒要卡音乐节拍，audio.currentTime 必须是主时间参考 ——
 *  滚动位置做不了这件事。滚轮/触摸/键盘改为直接写时间，
 *  于是自动播放与手动控制天然共享同一个状态，不可能出现两套进度。
 *
 *  时间轴以「秒」为单位，总长 14.4s：
 *    0.00 – 12.00  十二幕序幕（节奏见 cinema.js）
 *    12.00 – 14.40 羊皮纸卷起，露出底下的地图纸
 */
export default function EpicTimeline({ onActivate, onBeat, registerApi, manualMode }) {
  const rootRef = useRef(null);
  const paperRef = useRef(null);
  const sheetRef = useRef(null);
  const stageRef = useRef(null);
  const prologueRef = useRef(null);
  const ithakaRef = useRef(null);
  const volRefs = useRef([]);
  const layersRef = useRef({});
  const mapLayersRef = useRef(null);
  const tlRef = useRef(null);
  const activeRef = useRef(null);
  const rolledRef = useRef(false);
  const [mapLive, setMapLive] = useState(false);

  /* 外部回调一律走 ref，保证 setTime 是稳定引用（见 App 中的说明） */
  const onActivateRef = useRef(onActivate);
  const onBeatRef = useRef(onBeat);
  onActivateRef.current = onActivate;
  onBeatRef.current = onBeat;

  const registerLayer = useCallback((id, refs) => { layersRef.current[id] = refs; }, []);
  const registerMapLayers = useCallback((l) => { mapLayersRef.current = l; }, []);

  /* 由 cinema clock 每帧调用 —— 这是时间轴唯一的输入 */
  const setTime = useCallback((t) => {
    const tl = tlRef.current;
    if (tl) tl.time(Math.max(0, Math.min(TOTAL_DURATION, t)));

    let cur = null;
    for (const s of ODYSSEY_SCENES) {
      const c = CINEMA_CUES[s.id];
      if (c && t >= c.start && t <= c.end) cur = s.id;
    }
    if (cur && cur !== activeRef.current) {
      activeRef.current = cur;
      onActivateRef.current?.(cur);
    }
    if (t >= ROLL.start && !rolledRef.current) {
      rolledRef.current = true;
      onBeatRef.current?.('roll-up');
    } else if (t < ROLL.start && rolledRef.current) {
      rolledRef.current = false;
    }
    setMapLive(t >= ROLL.end - 0.15);
  }, []);

  useEffect(() => { registerApi?.({ setTime }); }, [registerApi, setTime]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const k = () => Math.min(1, window.innerWidth / 1280);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      tlRef.current = tl;
      tl.to({}, { duration: TOTAL_DURATION }, 0);

      /* 卷首题名 */
      if (prologueRef.current) {
        gsap.set(prologueRef.current, { autoAlpha: 0 });
        tl.fromTo(prologueRef.current, { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: PROLOGUE_TEXT.hold - PROLOGUE_TEXT.in }, PROLOGUE_TEXT.in)
          .to(prologueRef.current, { autoAlpha: 0, y: -6, duration: PROLOGUE_TEXT.out - PROLOGUE_TEXT.hold },
            PROLOGUE_TEXT.hold);
      }

      /* ── 十二幕：每幕按自己的转场语法进出 ── */
      ODYSSEY_SCENES.forEach((scene) => {
        const L = layersRef.current[scene.id];
        const c = CINEMA_CUES[scene.id];
        if (!L?.root || !c) return;

        const enterDur = c.peak - c.start;
        const span = c.end - c.start;
        const En = enterOf(c.enter);

        gsap.set(L.root, { autoAlpha: 0 });

        /* root 只管整幕存在与否；inner 承担转场语法 */
        tl.fromTo(L.root, { autoAlpha: 0 }, { autoAlpha: 1, duration: Math.min(enterDur, 0.22) }, c.start);

        if (reduce) {
          tl.fromTo(L.inner, { autoAlpha: 0 }, { autoAlpha: 1, duration: enterDur }, c.start);
        } else {
          tl.fromTo(L.inner, { ...En.from }, { ...En.to, duration: enterDur, ease: 'power2.out' }, c.start);
        }

        /* 镜头视差贯穿整幕 */
        if (!reduce) {
          const cam = scene.camera || {};
          if (cam.bg && L.bg) {
            tl.fromTo(L.bg, { x: 0, y: 0, scale: cam.bg.fromScale ?? 1 },
              { x: () => cam.bg.x * k(), y: () => cam.bg.y * k(), scale: cam.bg.scale, duration: span }, c.start);
          }
          if (cam.fg && L.fg) {
            tl.fromTo(L.fg, { x: 0, y: 0, scale: 1 },
              { x: () => cam.fg.x * k(), y: () => cam.fg.y * k(), scale: cam.fg.scale, duration: span }, c.start);
          }
          if (cam.fg && L.dust) {
            tl.fromTo(L.dust, { x: 0, y: 0 },
              { x: () => cam.fg.x * 1.35 * k(), y: () => cam.fg.y * 1.35 * k(), duration: span }, c.start);
          }
        }

        /* 退出 */
        const Ex = exitOf(c.exitFx);
        if (Ex) {
          const exitDur = c.end - c.exit;
          if (reduce) {
            tl.to(L.root, { autoAlpha: 0, duration: exitDur }, c.exit);
          } else {
            tl.to(L.inner, { ...Ex.to, duration: exitDur, ease: 'power2.in' }, c.exit);
            /* clipPath 类退出自身不带 opacity，需在末尾补一次收尾淡出 */
            if (CLIP_EXITS.has(c.exitFx)) {
              tl.to(L.root, { autoAlpha: 0, duration: exitDur * 0.35 }, c.exit + exitDur * 0.65);
            } else {
              tl.to(L.root, { autoAlpha: 0, duration: exitDur * 0.5 }, c.exit + exitDur * 0.5);
            }
          }
        }
      });

      /* 卷标记 */
      VOLUME_MARKS.forEach((v, i) => {
        const el = volRefs.current[i];
        if (!el) return;
        gsap.set(el, { autoAlpha: 0 });
        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: v.hold - v.in }, v.in)
          .to(el, { autoAlpha: 0, duration: v.out - v.hold }, v.hold);
      });

      /* 终幕文字 */
      if (ithakaRef.current) {
        gsap.set(ithakaRef.current, { autoAlpha: 0 });
        tl.fromTo(ithakaRef.current, { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: ITHAKA_TEXT.hold - ITHAKA_TEXT.in }, ITHAKA_TEXT.in)
          .to(ithakaRef.current, { autoAlpha: 0, duration: ITHAKA_TEXT.gone - ITHAKA_TEXT.out }, ITHAKA_TEXT.out);
      }

      /* ── 卷纸离场 ──────────────────────────────────────────
         右下角先起翘 → 卷筒沿对角线成形 → 整卷被斜着抽离。
         --roll 驱动一条倾斜的裁切边与卷筒；--lift 驱动翘角。 */
      if (sheetRef.current) {
        const sh = sheetRef.current;
        gsap.set(sh, { '--roll': 0, '--lift': 0 });

        const [la, lb] = ROLL.cornerLift;
        tl.to(sh, { '--lift': 1, duration: lb - la, ease: 'power2.out' }, la);

        const [ta, tb] = ROLL.travel;
        tl.to(sh, { '--roll': 100, duration: tb - ta, ease: 'power1.in' }, ta);

        const [pa, pb] = ROLL.pullAway;
        tl.to(sh, {
          xPercent: -26, yPercent: -14, rotate: -7, scale: 0.94,
          duration: pb - pa, ease: 'power2.in',
        }, pa);
      }

      /* 地图分阶段显现 */
      const M = mapLayersRef.current;
      if (M?.host) {
        const vars = {
          '--rv-coast': ROLL.mapCoast, '--rv-geo': ROLL.mapGeo,
          '--rv-route': ROLL.mapRoute, '--rv-nodes': ROLL.mapNodes,
          '--rv-labels': ROLL.mapLabels,
        };
        gsap.set(M.host, {
          '--rv-coast': 0, '--rv-geo': 0, '--rv-route': 0, '--rv-nodes': 0, '--rv-labels': 0,
        });
        Object.entries(vars).forEach(([name, [a, b]]) => {
          tl.fromTo(M.host, { [name]: 0 }, { [name]: 1, duration: b - a }, a);
        });
        if (M.chrome?.length) {
          const [a, b] = ROLL.mapLabels;
          const n = M.chrome.length;
          /* 错开量与时长各占一半，保证最后一个元素恰好在 b 结束，
             不把总时长顶出 TOTAL_DURATION（否则末尾几个永远淡不完）。 */
          const half = (b - a) * 0.5;
          gsap.set(M.chrome, { autoAlpha: 0 });
          tl.to(M.chrome, { autoAlpha: 1, duration: half, stagger: half / Math.max(n - 1, 1) }, a);
        }
      }

      if (window.location.search.includes('debug')) {
        window.__odyssey = { tl, gsap, setTime };
      }
      tl.time(0);
    }, root);

    return () => { ctx.revert(); tlRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="CinemaViewport" ref={rootRef}>
      {/* ── 底层：地图那张纸 ── */}
      <div className="CinemaSheet CinemaSheet--map">
        <Parchment variant="map" seed={7} />
        <div
          className="CinemaWorldmap"
          aria-hidden="true"
          style={{ backgroundImage: `url(${assetUrl(ASSETS.worldMap)})` }}
        />
        <OdysseyMap registerMapLayers={registerMapLayers} interactive={mapLive} />
      </div>

      {/* ── 上层：序幕那张纸，会被卷走 ── */}
      <div className="CinemaSheet CinemaSheet--epic" ref={sheetRef}>
        <div className="CinemaSheet__paper" ref={paperRef}>
          <Parchment variant="cinema" seed={3} />

          <div className="CinemaStage" ref={stageRef}>
            {ODYSSEY_SCENES.map((scene, i) => (
              <OdysseyScene key={scene.id} scene={scene} index={i} registerLayer={registerLayer} />
            ))}
          </div>

          <div className="CinemaPrologue" ref={prologueRef} aria-hidden="true">
            <p className="CinemaPrologue__gr">ΟΔΥΣΣΕΙΑ</p>
            <h1 className="CinemaPrologue__en">THE ODYSSEY</h1>
            <p className="CinemaPrologue__sub">A voyage home</p>
          </div>

          {VOLUME_MARKS.map((v, i) => (
            <div className="CinemaVolmark" key={v.no} aria-hidden="true"
              ref={(el) => { volRefs.current[i] = el; }}>
              <span className="CinemaVolmark__no">{v.no}</span>
              <span className="CinemaVolmark__name">{v.name}</span>
              <span className="CinemaVolmark__en">{v.en}</span>
            </div>
          ))}

          <div className="CinemaIthaka" ref={ithakaRef} aria-hidden="true">
            <p className="CinemaIthaka__gr">ΙΘΑΚΗ</p>
            <p className="CinemaIthaka__en">ITHACA</p>
            <p className="CinemaIthaka__cn">Home, at last.</p>
          </div>
        </div>

        {/* 卷轴：翘角 + 斜向卷筒 + 纸背 + 投影 */}
        <div className="CinemaRoll" aria-hidden="true">
          <div className="CinemaRoll__lift" />
          <div className="CinemaRoll__shade" />
          <div className="CinemaRoll__back" />
          <div className="CinemaRoll__cyl">
            <span className="CinemaRoll__edge" />
          </div>
        </div>
      </div>
    </div>
  );
}
