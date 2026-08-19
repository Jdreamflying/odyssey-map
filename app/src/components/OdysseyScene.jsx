import { useEffect, useMemo, useRef } from 'react';

/**
 * 单幕图层。纯呈现，不含任何动画逻辑 ——
 * 所有运动由 EpicTimeline 的主时间轴统一驱动（见 registerLayer）。
 *
 * 图版模型：铜版画是「印在羊皮纸上的一块图版」，不是铺满视口的背景照片。
 * 因此不再强制 object-fit: cover —— 由 scene.fit / scene.frame 逐幕决定
 * 版画在视口中的大小与位置，四周允许露出底下的羊皮纸。
 *
 *   fit 'contain'  整幅完整可见（默认），frame.width 控制图版宽度
 *   fit 'cover'    满铺视口，仅用于构图明确适合出血的幕
 *   fit 'custom'   由 frame 完全指定 width/height/x/y
 *
 * 图层自外向内：
 *   root   幕整体的 opacity 与转场位移
 *   inner  ENTER 的 scale + blur
 *   bg     镜头层（视差），内含 plate
 *   plate  图版本体（含纸面投影与版痕）
 *   dust   尘层，纵深最前平面
 */

const PARTICLE = {
  ash:   { size: [1.6, 4.4], op: [0.10, 0.40], cls: 'CinemaDust__p--ash' },
  dust:  { size: [1.0, 3.2], op: [0.08, 0.32], cls: 'CinemaDust__p--dust' },
  spray: { size: [1.0, 2.6], op: [0.12, 0.46], cls: 'CinemaDust__p--spray' },
  rain:  { size: [1.0, 1.8], op: [0.16, 0.48], cls: 'CinemaDust__p--rain', tall: 13 },
  mist:  { size: [26, 74],   op: [0.05, 0.13], cls: 'CinemaDust__p--mist' },
};

export default function OdysseyScene({ scene, index, registerLayer }) {
  const root = useRef(null);
  const inner = useRef(null);
  const bg = useRef(null);
  const fg = useRef(null);
  const dust = useRef(null);

  useEffect(() => {
    registerLayer?.(scene.id, {
      root: root.current,
      inner: inner.current,
      bg: bg.current,
      fg: fg.current,
      dust: dust.current,
    });
  }, [scene.id, registerLayer]);

  const particles = useMemo(() => {
    const cfg = PARTICLE[scene.particles?.type] || PARTICLE.dust;
    const n = scene.particles?.count ?? 0;
    return Array.from({ length: n }, () => {
      const size = cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]);
      return {
        left: Math.random() * 100,
        top: Math.random() * 100,
        w: size,
        h: size * (cfg.tall || 1),
        op: cfg.op[0] + Math.random() * (cfg.op[1] - cfg.op[0]),
        cls: cfg.cls,
      };
    });
  }, [scene.particles]);

  const fit = scene.fit || 'contain';
  const f = scene.frame || {};
  const plateStyle = {
    width: f.width || '94%',
    height: f.height || 'auto',
    transform: `translate(${f.x || '0%'}, ${f.y || '0%'})`,
  };

  return (
    <section
      className={`CinemaScene CinemaScene--${fit}`}
      ref={root}
      data-scene={scene.id}
      data-no={scene.no}
      style={{ zIndex: index + 1 }}
      aria-label={`${scene.no} · ${scene.subtitle}`}
    >
      <div className="CinemaScene__inner" ref={inner}>
        {/* 镜头层 */}
        <div className="CinemaScene__bg" ref={bg}>
          <figure className="CinemaScene__plate" style={plateStyle}>
            {scene.image ? (
              <img className="CinemaScene__img" src={scene.image} alt="" draggable="false" decoding="async" fetchPriority={index === 0 ? 'high' : 'auto'} />
            ) : (
              <MissingPlate scene={scene} />
            )}
          </figure>
        </div>

        {/* 前景板：等待 AI 前景图交付后启用视差 ×1.00 平面 */}
        <div className="CinemaScene__fg" ref={fg}>
          {scene.foregroundImage ? (
            <img className="CinemaScene__img" src={scene.foregroundImage} alt="" draggable="false" />
          ) : null}
        </div>

        {/* 尘层 ×1.35 */}
        <div className="CinemaScene__dust" ref={dust} aria-hidden="true">
          {particles.map((p, i) => (
            <span
              key={i}
              className={`CinemaDust__p ${p.cls}`}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.w}px`,
                height: `${p.h}px`,
                opacity: p.op,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** 缺图占位版。保持 16:9，明确标记，不使用任何外部图片。 */
function MissingPlate({ scene }) {
  return (
    <div className="CinemaMissing" role="img" aria-label={`${scene.title} 场景图缺失`}>
      <svg className="CinemaMissing__hatch" viewBox="0 0 160 90" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id={`mh-${scene.id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#17120c" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="160" height="90" fill={`url(#mh-${scene.id})`} opacity="0.5" />
      </svg>
      <div className="CinemaMissing__body">
        <p className="CinemaMissing__flag">SCENE IMAGE MISSING</p>
        <p className="CinemaMissing__no">{scene.no} · {scene.title}</p>
        {scene.note ? <p className="CinemaMissing__note">{scene.note}</p> : null}
      </div>
    </div>
  );
}
