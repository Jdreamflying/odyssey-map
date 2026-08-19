import { useCallback, useEffect, useRef, useState } from 'react';
import { MANUAL, TOTAL_DURATION, assetUrl, ASSETS } from '../data/cinema.js';

/**
 * ════════════════════════════════════════════════════════════════
 *  Cinema Clock —— 全片唯一的时间状态
 * ════════════════════════════════════════════════════════════════
 *
 *  自动播放与手动控制共享同一个 time（秒），不存在两套进度：
 *
 *    playing 且有音乐  →  time = audio.currentTime   （音乐为主时间参考）
 *    playing 且无音乐  →  time += dt                 （rAF 自走）
 *    手动              →  time 平滑趋近 targetRef    （滚轮/触摸/键盘写入）
 *
 *  接管规则（本轮改动）：用户一旦主动操作，autoplay **直接暂停**，
 *  不再有静默计时自动抢回控制权。只有点 Play 才继续，
 *  且从当前时间点继续 —— 音乐会 seek 到该时间，画面与声音保持同步。
 */
export default function useCinema({ onTime } = {}) {
  const [playing, setPlaying] = useState(false);
  const [locked, setLocked] = useState(false);
  const [tookOver, setTookOver] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [time, setTimeState] = useState(0);

  const timeRef = useRef(0);
  const targetRef = useRef(0);
  const playingRef = useRef(false);
  const audioRef = useRef(null);
  const rollAudioRef = useRef(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const onTimeRef = useRef(onTime);
  const lockedRef = useRef(false);
  const uiSyncRef = useRef(0);
  const errLoggedRef = useRef(false);
  const frameRef = useRef(0);

  onTimeRef.current = onTime;

  const setTime = useCallback((t) => {
    const v = Math.max(0, Math.min(TOTAL_DURATION, t));
    timeRef.current = v;
    targetRef.current = v;
    onTimeRef.current?.(v);
    setTimeState(v);
  }, []);

  /* ── 音频：存在则接入，不存在静默降级 ── */
  useEffect(() => {
    const a = new Audio();
    a.preload = 'auto';
    a.src = assetUrl(ASSETS.music);
    const ok = () => setHasAudio(true);
    const fail = () => setHasAudio(false);
    a.addEventListener('canplaythrough', ok);
    a.addEventListener('loadedmetadata', ok);
    a.addEventListener('error', fail);
    audioRef.current = a;

    const r = new Audio();
    r.preload = 'auto';
    r.src = assetUrl(ASSETS.paperRoll);
    r.addEventListener('error', () => { rollAudioRef.current = null; });
    rollAudioRef.current = r;

    return () => {
      a.removeEventListener('canplaythrough', ok);
      a.removeEventListener('loadedmetadata', ok);
      a.removeEventListener('error', fail);
      a.pause();
      r.pause();
    };
  }, []);

  const play = useCallback(() => {
    playingRef.current = true;
    setPlaying(true);
    setTookOver(false);
    const a = audioRef.current;
    if (a && hasAudio) {
      try {
        a.currentTime = Math.min(timeRef.current, a.duration || TOTAL_DURATION);
        a.play().catch(() => {});   // 自动播放被拦截时静默失败，画面照走
      } catch (_) { /* 忽略 */ }
    }
  }, [hasAudio]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    audioRef.current?.pause();
  }, []);

  /** 进入地图阶段后锁定 —— 滚轮/触摸/键盘不再能倒回电影 */
  const lock = useCallback(() => {
    lockedRef.current = true;
    setLocked(true);
    playingRef.current = false;
    setPlaying(false);
    audioRef.current?.pause();
  }, []);

  /** 重播序幕：解锁 → 时间归零 → 音频归零 → 重新播放 */
  const replay = useCallback(() => {
    lockedRef.current = false;
    setLocked(false);
    setTookOver(false);
    timeRef.current = 0;
    targetRef.current = 0;
    onTimeRef.current?.(0);
    setTimeState(0);
    const a = audioRef.current;
    if (a) { try { a.pause(); a.currentTime = 0; } catch (_) { /* 忽略 */ } }
    playingRef.current = true;
    setPlaying(true);
    if (a && hasAudio) { try { a.play().catch(() => {}); } catch (_) { /* 忽略 */ } }
  }, [hasAudio]);

  /** 用户主动接管：暂停自动播放，不再自动恢复 */
  const takeOver = useCallback(() => {
    if (lockedRef.current) return;
    if (playingRef.current) {
      playingRef.current = false;
      setPlaying(false);
      audioRef.current?.pause();
    }
    setTookOver(true);
  }, []);

  const seekBy = useCallback((delta) => {
    targetRef.current = Math.max(0, Math.min(TOTAL_DURATION, targetRef.current + delta));
  }, []);

  const seekTo = useCallback((t) => {
    targetRef.current = Math.max(0, Math.min(TOTAL_DURATION, t));
  }, []);

  /** 卷纸音效，由外部在 roll 开始时触发一次 */
  const playRollSound = useCallback(() => {
    const r = rollAudioRef.current;
    if (!r) return;
    try { r.currentTime = 0; r.play().catch(() => {}); } catch (_) { /* 忽略 */ }
  }, []);

  /* ── 手动输入 ── */
  useEffect(() => {
    const onWheel = (e) => {
      if (lockedRef.current) return;      // 地图阶段：滚轮交给地图，不再倒回电影
      takeOver();
      seekBy(e.deltaY * MANUAL.wheelToSeconds);
    };
    let touchY = null;
    const onTouchStart = (e) => { if (lockedRef.current) return; touchY = e.touches[0]?.clientY ?? null; takeOver(); };
    const onTouchMove = (e) => {
      if (lockedRef.current) return;
      const y = e.touches[0]?.clientY;
      if (y == null || touchY == null) return;
      seekBy((touchY - y) * MANUAL.touchToSeconds);
      touchY = y;
    };
    const onKey = (e) => {
      if (lockedRef.current) return;
      const fwd = ['ArrowDown', 'ArrowRight', 'PageDown'];
      const back = ['ArrowUp', 'ArrowLeft', 'PageUp'];
      if (fwd.includes(e.key)) { takeOver(); seekBy(MANUAL.keyStep); }
      else if (back.includes(e.key)) { takeOver(); seekBy(-MANUAL.keyStep); }
      else if (e.key === 'Home') { takeOver(); seekTo(0); }
      else if (e.key === 'End') { takeOver(); seekTo(TOTAL_DURATION); }
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [takeOver, seekBy, seekTo]);

  /* ── 主循环 ── */
  useEffect(() => {
    const tick = () => {
      /* 用 performance.now() 而不是 rAF 传入的时间戳：
         某些环境下（无头浏览器、后台标签页）回调时间戳会停滞，
         dt 恒为 0，画面就卡在开头不动。 */
      const now = performance.now();
      const dt = lastRef.current ? Math.min((now - lastRef.current) / 1000, 0.08) : 0;
      lastRef.current = now;

      const a = audioRef.current;
      if (lockedRef.current) {
        timeRef.current = TOTAL_DURATION;
        targetRef.current = TOTAL_DURATION;
      } else if (playingRef.current) {
        if (hasAudio && a && !a.paused && a.currentTime > 0) {
          /* 音乐为主时间参考 —— 画面永远跟着声音走，不会漂 */
          timeRef.current = Math.min(a.currentTime, TOTAL_DURATION);
        } else {
          timeRef.current = Math.min(timeRef.current + dt, TOTAL_DURATION);
        }
        targetRef.current = timeRef.current;
        if (timeRef.current >= TOTAL_DURATION) {
          playingRef.current = false;
          setPlaying(false);
        }
      } else {
        /* 手动：平滑趋近目标，避免滚轮抖动直接抖到画面上 */
        const d = targetRef.current - timeRef.current;
        if (Math.abs(d) > 0.0004) timeRef.current += d * MANUAL.ease;
        else timeRef.current = targetRef.current;
      }

      /* 派发时间必须包在 try 里：rAF 的重排在函数末尾，
         这里一旦抛异常整条链就断了，画面会永久停在当前帧 ——
         而且没有任何报错提示，极难定位。 */
      try {
        onTimeRef.current?.(timeRef.current);
      } catch (err) {
        if (!errLoggedRef.current) {
          errLoggedRef.current = true;
          console.error('[cinema] onTime 抛出异常，时间轴已跳过该帧：', err);
        }
      }

      /* UI 状态每 ~100ms 同步一次即可，不必每帧 setState */
      if (now - uiSyncRef.current > 100) {
        uiSyncRef.current = now;
        setTimeState(timeRef.current);
      }

      frameRef.current += 1;
      rafRef.current = requestAnimationFrame(tick);
    };
    if (typeof window !== 'undefined' && window.location.search.includes('debug')) {
      window.__cinema = { timeRef, playingRef, lockedRef, frameRef, hasAudio: () => hasAudio };
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [hasAudio]);

  return {
    time, playing, tookOver, hasAudio, locked,
    play, pause, takeOver, seekBy, seekTo, setTime, playRollSound, lock, replay,
    timeRef,
  };
}
