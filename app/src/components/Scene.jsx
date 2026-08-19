import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { meander } from '../scenes/engraving.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * 粒子类型表。粒子全部挂在 ScrollTrigger 时间轴里由滚动驱动
 * （进入→停留→离开随场景淡入淡出，停留阶段每个粒子以不同速率
 * 缓慢沉降/升腾）—— 没有任何自动播放。
 */
const PARTICLE_TYPES = {
  ash:   { size: [1.5, 4.5], opacity: [0.10, 0.42], className: 'particle--ash',   tall: 1, dir: 1,  drift: [30, 70] },
  dust:  { size: [1, 3.2],   opacity: [0.08, 0.34], className: 'particle--dust',  tall: 1, dir: -1, drift: [20, 55] },
  spray: { size: [1, 2.6],   opacity: [0.12, 0.5],  className: 'particle--spray', tall: 1, dir: -1, drift: [30, 80] },
  rain:  { size: [1, 1.8],   opacity: [0.16, 0.5],  className: 'particle--rain',  tall: 14, dir: 1, drift: [90, 160] },
  leaf:  { size: [3, 6.5],   opacity: [0.12, 0.4],  className: 'particle--leaf',  tall: 1, dir: 1, drift: [25, 65] },
};

export default function Scene({ scene, index, total, registerTrigger, onActivate }) {
  const sectionRef = useRef(null);
  const innerRef = useRef(null);
  const bgRef = useRef(null);
  const fgRef = useRef(null);
  const particlesRef = useRef(null);

  const particles = useMemo(() => {
    const cfg = PARTICLE_TYPES[scene.particles?.type] || PARTICLE_TYPES.ash;
    const count = scene.particles?.count ?? 0;
    return Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]),
      op: cfg.opacity[0] + Math.random() * (cfg.opacity[1] - cfg.opacity[0]),
      type: cfg.className,
      tall: cfg.tall,
      dir: cfg.dir,
      drift: cfg.drift[0] + Math.random() * (cfg.drift[1] - cfg.drift[0]),
    }));
  }, [scene]);

  /* 滚动动画：进入 → 停留（镜头移动）→ 离开 */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const ctx = gsap.context(() => {
      const bg = scene.background?.art ? bgRef.current : null;
      const fg = scene.foreground?.art ? fgRef.current : null;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=200%',
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          onToggle: (self) => {
            if (self.isActive) onActivate?.(scene.id);
          },
        },
      });

      // 进入：opacity 0→1, scale 1.15→1, blur 20→0
      tl.fromTo(
        innerRef.current,
        { opacity: 0, scale: 1.15, filter: 'blur(20px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.22, ease: 'none' }
      )
        // 停留：画面静止，镜头缓慢移动
        .to(innerRef.current, { duration: 0.52, ease: 'none' }, 0.22)
        // 离开：opacity 1→0, x 0→-240
        .to(innerRef.current, { opacity: 0, x: -240, duration: 0.26, ease: 'power1.in' }, 0.74);

      // 镜头：背景与前景以相反方向漂移，形成观画般的视差
      if (bg && scene.background.camera) {
        const c = scene.background.camera;
        tl.fromTo(bg, { x: 0, y: 0, scale: 1 }, { x: c.x, y: c.y, scale: c.scale, duration: 0.52, ease: 'none' }, 0.22);
      }
      if (fg && scene.foreground.camera) {
        const c = scene.foreground.camera;
        tl.fromTo(fg, { x: 0, y: 0, scale: 1 }, { x: c.x, y: c.y, scale: c.scale, duration: 0.52, ease: 'none' }, 0.22);
      }

      // 粒子：每个粒子以不同速率沉降/升腾，全部挂在时间轴上由滚动驱动（回滚即倒放）
      const reduceMotion =
        typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const parts = particlesRef.current?.children;
      if (!reduceMotion && parts && parts.length) {
        Array.from(parts).forEach((el) => {
          const d = parseFloat(el.dataset.drift || 30);
          tl.fromTo(el, { y: 0 }, { y: (el.dataset.dir === 'up' ? -1 : 1) * d, duration: 0.52, ease: 'none' }, 0.22);
        });
      }
    }, section);

    // 注册 ScrollTrigger，供 Navigation 跳转用
    const st = ScrollTrigger.getAll().find((s) => s.trigger === section);
    registerTrigger?.(scene.id, st);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id]);

  const bgImage = scene.background?.image || null;
  const fgImage = scene.foreground?.image || null;

  return (
    <section className="scene" ref={sectionRef} data-scene={scene.id}>
      <div className="scene__inner" ref={innerRef} style={{ opacity: 0, filter: 'blur(20px)' }}>
        {/* 背景层插图（预留 AI 图片图源） */}
        <div className="scene__bg" ref={bgRef}>
          {bgImage ? (
            <img src={bgImage} alt={scene.title} className="scene__art-image" />
          ) : scene.background?.art ? (
            <div className="scene__art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: scene.background.art }} />
          ) : null}
        </div>

        {/* 前景层插图 */}
        <div className="scene__fg" ref={fgRef}>
          {fgImage ? (
            <img src={fgImage} alt="" className="scene__art-image" />
          ) : scene.foreground?.art ? (
            <div className="scene__art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: scene.foreground.art }} />
          ) : null}
        </div>

        {/* 文字 */}
        <div className="scene__text">
          <div className="scene__kicker">
            <span className="scene__numeral">{scene.numeral}</span>
            <span className="scene__time">{scene.time}</span>
          </div>
          <h2 className="scene__title">{scene.titleCn}</h2>
          <h3 className="scene__title-en">{scene.title}</h3>
          <svg className="scene__meander" viewBox="0 0 220 18" aria-hidden="true">
            <path d={meander(220)} fill="none" stroke="currentColor" strokeWidth="1.1" />
          </svg>
          <blockquote className="scene__epigraph">
            <span className="scene__epigraph-gr">{scene.epigraph}</span>
            <span className="scene__epigraph-cn">{scene.epigraphCn} — {scene.epigraphSource}</span>
          </blockquote>
          <p className="scene__body">
            {scene.text.map((line, i) => (
              <span key={i} className="scene__line">{line}</span>
            ))}
          </p>
        </div>

        {/* 粒子（漂移由滚动驱动） */}
        <div className="scene__particles" ref={particlesRef} aria-hidden="true">
          {particles.map((p, i) => (
            <span
              key={i}
              className={`particle ${p.type}`}
              data-drift={p.drift.toFixed(1)}
              data-dir={p.dir === -1 ? 'up' : 'down'}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.size}px`,
                height: `${p.size * p.tall}px`,
                opacity: p.op,
              }}
            />
          ))}
        </div>
      </div>
      {/* 场景序号水印 */}
      <span className="scene__index" aria-hidden="true">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
    </section>
  );
}
