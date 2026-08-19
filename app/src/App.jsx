import { useCallback, useEffect, useRef, useState } from 'react';
import EpicTimeline from './components/EpicTimeline.jsx';
import Navigation from './components/Navigation.jsx';
import LandmarkTuner from './components/LandmarkTuner.jsx';
import useCinema from './hooks/useCinema.js';
import { ODYSSEY_SCENES } from './data/odysseyScenes.js';
import { CINEMA_CUES, ROLL, EPIC_DURATION, TOTAL_DURATION } from './data/cinema.js';
import './styles/fonts.css';
import './styles/index.css';
import './styles/parchment.css';
import './styles/timeline.css';
import './styles/map.css';
import './styles/map-v2.css';
import './styles/map-v3.css';

export default function App() {
  const apiRef = useRef(null);
  const [active, setActive] = useState(ODYSSEY_SCENES[0].id);
  const [phase, setPhase] = useState('epic');
  const tuningMode = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('tune') === 'landmarks';

  const handleTime = useCallback((t) => {
    apiRef.current?.setTime(t);
  }, []);

  const cinema = useCinema({ onTime: handleTime });

  /* ⚠ 这两个回调必须是稳定引用。
     cinema 每次 render 都是新对象，若 handleBeat 依赖它，就会
     级联导致 EpicTimeline 的 setTime 重建 → registerApi effect 重跑，
     而 registerApi 里原本还调了 api.setTime(0) —— 时间轴每秒被打回
     原点十几次，影片永远走不过 0.1 秒。 */
  const rollSoundRef = useRef(null);
  rollSoundRef.current = cinema.playRollSound;

  const handleBeat = useCallback((event) => {
    if (event === 'roll-up') rollSoundRef.current?.();
  }, []);

  const registerApi = useCallback((api) => {
    apiRef.current = api;   // 不在这里 setTime —— 初始帧由时钟自己推
  }, []);

  /* 进入即自动播放；音频若被浏览器拦截会静默失败，画面照走 */
  useEffect(() => {
    if (tuningMode) {
      cinema.setTime(TOTAL_DURATION);
      return undefined;
    }
    const t = setTimeout(() => cinema.play(), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 阶段：序幕 / 卷起 / 地图。进入地图立即锁定 cinema。 */
  useEffect(() => {
    const t = cinema.time;
    const p = t >= ROLL.end - 0.15 ? 'map' : t >= ROLL.start ? 'rolling' : 'epic';
    setPhase(p);
    if (p === 'map' && !cinema.locked) cinema.lock();
  }, [cinema.time, cinema.locked, cinema]);

  const handleNavigate = useCallback((id) => {
    const c = CINEMA_CUES[id];
    if (c) { cinema.takeOver(); cinema.seekTo(c.peak); }
  }, [cinema]);

  const pct = Math.min(1, cinema.time / EPIC_DURATION);

  return (
    <div className="app" data-phase={phase} data-tuning={tuningMode ? 'true' : 'false'}>
      {tuningMode && phase === 'map' && <LandmarkTuner />}

      <EpicTimeline
        onActivate={setActive}
        onBeat={handleBeat}
        registerApi={registerApi}
        manualMode={cinema.tookOver}
      />

      {/* 章节导航：仅手动模式出现，自动播放时不打扰 */}
      <div className="chrome" data-visible={cinema.tookOver && phase === 'epic' ? 'true' : 'false'}>
        <Navigation active={active} onNavigate={handleNavigate} />
      </div>

      {/* 重播影片 —— 唯一能回到序幕的入口 */}
      <button
        type="button"
        className="replay"
        data-visible={phase === 'map' ? 'true' : 'false'}
        onClick={cinema.replay}
      >
        <span className="replay__mark">↺</span>
        <span className="replay__cn">重播影片</span>
        <span className="replay__en">Replay Prologue</span>
      </button>

      {/* 极简走带：一条细进度线 + 播放/暂停。序幕结束后整组退场。 */}
      <div className="transport" data-visible={phase === 'epic' || phase === 'rolling' ? 'true' : 'false'}>
        <button
          type="button"
          className="transport__btn"
          onClick={() => (cinema.playing ? cinema.pause() : cinema.play())}
          aria-label={cinema.playing ? '暂停' : '播放'}
        >
          {cinema.playing ? '❙❙' : '▶'}
        </button>
        <div className="transport__rail" aria-hidden="true">
          <div className="transport__fill" style={{ transform: `scaleX(${pct})` }} />
        </div>
        <span className="transport__time" aria-hidden="true">
          {cinema.time.toFixed(1)}s
          {cinema.tookOver ? ' · 手动' : cinema.playing ? '' : ' · 暂停'}
        </span>
      </div>
    </div>
  );
}
