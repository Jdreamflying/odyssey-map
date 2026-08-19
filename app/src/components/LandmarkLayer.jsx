import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { landmarkFor, LANDMARKS } from '../data/landmarks.js';

const STORAGE_KEY = 'odyssey.landmark-tuning.v1';
function storedPresets() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return value && typeof value === 'object' ? value : {};
  } catch (_) { return {}; }
}

/** Active landmark watermark plus a private live-tuning event channel. */
export default function LandmarkLayer() {
  const slotA = useRef(null);
  const slotB = useRef(null);
  const useA = useRef(true);
  const cacheRef = useRef({});
  const curRef = useRef(null);
  const curIndexRef = useRef(null);
  const livePresetRef = useRef(storedPresets());

  const applyInk = (figure, lm) => {
    if (!figure) return;
    figure.style.setProperty('--lm-brightness', String(lm.brightness ?? 1.026));
    figure.style.setProperty('--lm-veil', String(lm.inkOpacity ?? 0.86));
  };

  const applyPlacement = (figure, lm) => {
    if (!figure) return;
    const sc = lm.scale ?? 1;
    applyInk(figure, lm);
    gsap.set(figure, {
      autoAlpha: lm.opacity ?? 0.32,
      scale: sc,
      xPercent: lm.offsetX ?? lm.x ?? 0,
      yPercent: lm.offsetY ?? lm.y ?? 0,
      rotation: lm.rotation ?? 0,
      filter: 'blur(0px)',
    });
    figure._sc = sc;
  };

  useEffect(() => {
    let cancelled = false;
    const tuning = new URLSearchParams(window.location.search).get('tune') === 'landmarks';
    const preloadStart = tuning ? 250 : 15500;
    const preloadStep = tuning ? 140 : 300;
    const timers = LANDMARKS.map((l, n) => setTimeout(() => {
      if (cancelled) return;
      const src = landmarkFor(l.i)?.src;
      if (!src || cacheRef.current[src] !== undefined) return;
      const img = new Image();
      img.onload = () => { cacheRef.current[src] = true; };
      img.onerror = () => { cacheRef.current[src] = false; };
      img.src = src;
    }, preloadStart + n * preloadStep));
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    const swap = (lm) => {
      if (curRef.current === lm.src) return;
      curRef.current = lm.src;
      curIndexRef.current = lm.i;

      const incoming = useA.current ? slotB.current : slotA.current;
      const outgoing = useA.current ? slotA.current : slotB.current;
      if (!incoming) return;
      useA.current = !useA.current;
      incoming.querySelector('img').src = lm.src;

      gsap.killTweensOf([incoming, outgoing]);
      const peak = lm.opacity ?? 0.32;
      const sc = lm.scale ?? 1;
      const dx = lm.offsetX ?? lm.x ?? 0;
      const dy = lm.offsetY ?? lm.y ?? 0;
      const rot = lm.rotation ?? 0;
      applyInk(incoming, lm);

      gsap.set(incoming, { zIndex: 2 });
      gsap.set(outgoing, { zIndex: 1 });
      gsap.fromTo(incoming,
        { autoAlpha: 0, scale: sc * 1.035, xPercent: dx, yPercent: dy, rotation: rot, filter: 'blur(9px)' },
        { autoAlpha: peak, scale: sc, xPercent: dx, yPercent: dy, rotation: rot, filter: 'blur(0px)', duration: 1.25, ease: 'power2.out' });
      if (outgoing) {
        gsap.to(outgoing, {
          autoAlpha: 0, scale: (outgoing._sc || 1) * 0.96, filter: 'blur(7px)', duration: 1.05, ease: 'power2.in',
        });
      }
      incoming._sc = sc;
    };

    const onSelect = (e) => {
      const index = e.detail?.index;
      const lm = landmarkFor(index);
      if (!lm) return;
      const tuned = { ...lm, ...(livePresetRef.current[index] || {}) };
      const cached = cacheRef.current[lm.src];
      if (cached === false) return;
      if (cached === true) { swap(tuned); return; }
      const probe = new Image();
      probe.onload = () => { cacheRef.current[lm.src] = true; swap(tuned); };
      probe.onerror = () => { cacheRef.current[lm.src] = false; };
      probe.src = lm.src;
    };

    const onTune = (e) => {
      const { index, preset } = e.detail || {};
      if (!Number.isInteger(index) || !preset) return;
      livePresetRef.current[index] = { ...preset };
      if (curIndexRef.current !== index) {
        onSelect({ detail: { index } });
        return;
      }
      const current = useA.current ? slotA.current : slotB.current;
      applyPlacement(current, { ...landmarkFor(index), ...preset });
    };

    document.addEventListener('odyssey:select', onSelect);
    document.addEventListener('odyssey:landmark-tune', onTune);
    return () => {
      document.removeEventListener('odyssey:select', onSelect);
      document.removeEventListener('odyssey:landmark-tune', onTune);
    };
  }, []);

  return (
    <div className="landmark-stage" aria-hidden="true">
      <figure className="landmark" ref={slotA}><img alt="" draggable="false" /></figure>
      <figure className="landmark" ref={slotB}><img alt="" draggable="false" /></figure>
    </div>
  );
}
