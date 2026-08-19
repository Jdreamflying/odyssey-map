import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 自动推进 —— 让长卷在无人操作时缓慢自己走下去。
 *
 * 核心约定：**自动播放推进的是 window 的滚动位置本身**，
 * 而不是直接写 gsap timeline 的 progress。
 * 于是 ScrollTrigger 始终是唯一状态源，自动播放与浏览器滚动位置
 * 不可能打架，可逆性也自然成立 —— 因为「回看」就是把滚动条往回拖，
 * 与自动播放走的是同一个量。
 *
 * 接管规则：
 *   wheel / touchstart / touchmove / keydown（方向键等）→ 立即让出控制权
 *   让出后进入 holding 状态，用户滚动即最高优先级
 *   停手 idleResumeDelay 毫秒后，自动推进重新接上
 *   显式暂停（pause）优先级高于一切，不受 idle 影响
 */
export default function useAutoplay({
  rate = 0.006,
  idleResumeDelay = 2600,
  startDelay = 1200,
  shouldRun,
} = {}) {
  const [enabled, setEnabled] = useState(true);   // 用户的「暂停 / 继续」意愿
  const [running, setRunning] = useState(false);  // 此刻是否真的在自动推进

  const enabledRef = useRef(true);
  const holdingRef = useRef(false);
  const rafRef = useRef(0);
  const idleRef = useRef(0);
  const startRef = useRef(0);
  const lastRef = useRef(0);
  const armedRef = useRef(false);                 // 首次延迟是否已过
  const shouldRunRef = useRef(shouldRun);

  shouldRunRef.current = shouldRun;

  const pause = useCallback(() => {
    enabledRef.current = false;
    setEnabled(false);
  }, []);

  const resume = useCallback(() => {
    enabledRef.current = true;
    setEnabled(true);
  }, []);

  const toggle = useCallback(() => {
    if (enabledRef.current) pause();
    else resume();
  }, [pause, resume]);

  useEffect(() => {
    const scrollRange = () =>
      Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    /* 用户操作 → 立即让出，并重置静默计时 */
    const yieldToUser = () => {
      holdingRef.current = true;
      setRunning(false);
      window.clearTimeout(idleRef.current);
      idleRef.current = window.setTimeout(() => {
        holdingRef.current = false;
      }, idleResumeDelay);
    };

    const onKey = (e) => {
      const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar'];
      if (keys.includes(e.key)) yieldToUser();
    };

    window.addEventListener('wheel', yieldToUser, { passive: true });
    window.addEventListener('touchstart', yieldToUser, { passive: true });
    window.addEventListener('touchmove', yieldToUser, { passive: true });
    window.addEventListener('keydown', onKey);

    startRef.current = window.setTimeout(() => {
      armedRef.current = true;
    }, startDelay);

    const tick = (now) => {
      const dt = lastRef.current ? Math.min(now - lastRef.current, 80) : 0;
      lastRef.current = now;

      const ok =
        armedRef.current &&
        enabledRef.current &&
        !holdingRef.current &&
        (shouldRunRef.current ? shouldRunRef.current() : true);

      if (ok && dt > 0) {
        const range = scrollRange();
        const next = window.scrollY + rate * (dt / 1000) * range;
        if (next < range) {
          window.scrollTo(0, next);
          setRunning((r) => (r ? r : true));
        } else {
          window.scrollTo(0, range);
          setRunning(false);
        }
      } else {
        setRunning((r) => (r ? false : r));
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(idleRef.current);
      window.clearTimeout(startRef.current);
      window.removeEventListener('wheel', yieldToUser);
      window.removeEventListener('touchstart', yieldToUser);
      window.removeEventListener('touchmove', yieldToUser);
      window.removeEventListener('keydown', onKey);
    };
  }, [rate, idleResumeDelay, startDelay]);

  return { enabled, running, pause, resume, toggle };
}
