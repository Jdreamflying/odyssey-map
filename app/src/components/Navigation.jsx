import { useMemo } from 'react';
import { ODYSSEY_SCENES, VOLUMES } from '../data/odysseyScenes.js';

/**
 * 卷章导航：右侧竖排的十二节点索引，按三卷分组。
 * 点击跳到该幕的 peak 进度（画面最清晰处），由 EpicTimeline 换算滚动位置。
 */
export default function Navigation({ active, onNavigate }) {
  const groups = useMemo(
    () =>
      VOLUMES.map((v) => ({
        ...v,
        items: ODYSSEY_SCENES.filter((s) => s.volume === v.no),
      })),
    []
  );

  return (
    <nav className="navigation" aria-label="十二节点导航">
      {groups.map((g, gi) => (
        <div className="navigation__group" key={g.no}>
          {gi > 0 ? <span className="navigation__rule" aria-hidden="true" /> : null}
          <span className="navigation__vol" aria-hidden="true">{g.greek}</span>
          {g.items.map((s) => {
            const isActive = s.id === active;
            return (
              <button
                key={s.id}
                type="button"
                className={`navigation__item${isActive ? ' is-active' : ''}`}
                onClick={() => onNavigate?.(s.id)}
                aria-current={isActive ? 'true' : undefined}
                title={`${s.no} · ${s.subtitle}`}
              >
                <span className="navigation__dot" aria-hidden="true" />
                <span className="navigation__label">
                  <span className="navigation__numeral">{s.no}</span>
                  <span className="navigation__name">{s.subtitle}</span>
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
