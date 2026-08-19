import { useEffect, useMemo, useState } from 'react';
import { LANDMARKS } from '../data/landmarks.js';
import '../styles/landmark-tuner.css';

const STORAGE_KEY = 'odyssey.landmark-tuning.v1';
const NAMES = [
  '特洛伊 Troy', '伊斯马罗斯 Ismaros', '食莲人之地 Lotophagi', '独眼巨人 Cyclops',
  '风神岛 Aeolia', '莱斯特律戈涅斯 Laestrygonians', '埃埃亚岛 Circe', '冥府入口 Underworld',
  '塞壬之岛 Sirens', '斯库拉海峡 Scylla', '特里纳基亚 Thrinacia', '俄古癸亚 Ogygia',
  '斯刻里亚 Scheria', '伊萨卡 Ithaca',
];
const FIELDS = [
  { key: 'offsetX', label: '水平位置', min: -20, max: 20, step: 0.1, unit: '%' },
  { key: 'offsetY', label: '垂直位置', min: -15, max: 15, step: 0.1, unit: '%' },
  { key: 'scale', label: '图片大小', min: 0.45, max: 1.2, step: 0.005, unit: 'x' },
  { key: 'opacity', label: '整体显隐', min: 0.03, max: 0.5, step: 0.002, unit: '' },
  { key: 'brightness', label: '墨色深度', min: 0.55, max: 1.35, step: 0.005, unit: '' },
  { key: 'inkOpacity', label: '贴图透明度', min: 0.2, max: 1, step: 0.005, unit: '' },
  { key: 'rotation', label: '轻微旋转', min: -4, max: 4, step: 0.05, unit: '°' },
];

function defaults() {
  return Object.fromEntries(LANDMARKS.map((l) => [l.i, {
    scale: l.scale,
    opacity: l.opacity,
    offsetX: l.offsetX ?? l.x ?? 0,
    offsetY: l.offsetY ?? l.y ?? 0,
    rotation: l.rotation ?? 0,
    brightness: l.brightness ?? 1.026,
    inkOpacity: l.inkOpacity ?? 0.86,
  }]));
}
function loadStored() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return value && typeof value === 'object' ? value : {};
  } catch (_) { return {}; }
}

export default function LandmarkTuner() {
  const base = useMemo(defaults, []);
  const [values, setValues] = useState(() => {
    const stored = loadStored();
    return Object.fromEntries(Object.entries(base).map(([i, p]) => [i, { ...p, ...(stored[i] || {}) }]));
  });
  const [active, setActive] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [saved, setSaved] = useState('');
  const current = values[active];

  const preview = (index, preset) => {
    document.dispatchEvent(new CustomEvent('odyssey:landmark-tune', { detail: { index, preset } }));
  };
  const selectLandmark = (index) => {
    setActive(index);
    const node = document.querySelectorAll('#map .node')[index];
    if (node) node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    setTimeout(() => preview(index, values[index]), 40);
  };

  useEffect(() => {
    const timer = setTimeout(() => selectLandmark(0), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (key, raw) => {
    const nextPreset = { ...current, [key]: Number(raw) };
    const next = { ...values, [active]: nextPreset };
    setValues(next);
    preview(active, nextPreset);
  };
  const flash = (message) => {
    setSaved(message);
    window.clearTimeout(flash.timer);
    flash.timer = window.setTimeout(() => setSaved(''), 1800);
  };
  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    flash('已保存到浏览器');
  };
  const resetCurrent = () => {
    const next = { ...values, [active]: { ...base[active] } };
    setValues(next);
    preview(active, next[active]);
    flash('已恢复这一张');
  };
  const resetAll = () => {
    setValues(base);
    localStorage.removeItem(STORAGE_KEY);
    preview(active, base[active]);
    flash('14 张已恢复默认');
  };
  const exportData = async () => {
    const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), landmarks: values }, null, 2);
    try { await navigator.clipboard.writeText(payload); } catch (_) { /* download remains available */ }
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'odyssey-landmark-presets.json';
    a.click();
    URL.revokeObjectURL(url);
    flash('参数已复制并下载');
  };
  const exit = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    const url = new URL(window.location.href);
    url.searchParams.delete('tune');
    window.location.href = url.toString();
  };

  if (collapsed) {
    return <button className="lm-tuner__reopen" type="button" onClick={() => setCollapsed(false)}>打开 Landmark 调参</button>;
  }

  return (
    <aside className="lm-tuner" aria-label="Landmark 实时调参">
      <header className="lm-tuner__header">
        <div><strong>Landmark 调参台</strong><small>实时预览 · 默认仅你可见</small></div>
        <button type="button" onClick={() => setCollapsed(true)} aria-label="收起">—</button>
      </header>

      <label className="lm-tuner__select">
        <span>当前图片</span>
        <select value={active} onChange={(e) => selectLandmark(Number(e.target.value))}>
          {NAMES.map((name, i) => <option key={name} value={i}>{String(i + 1).padStart(2, '0')} · {name}</option>)}
        </select>
      </label>

      <div className="lm-tuner__quick">
        <button type="button" disabled={active === 0} onClick={() => selectLandmark(active - 1)}>上一张</button>
        <span>{active + 1} / 14</span>
        <button type="button" disabled={active === 13} onClick={() => selectLandmark(active + 1)}>下一张</button>
      </div>

      <div className="lm-tuner__sliders">
        {FIELDS.map((field) => (
          <label className="lm-tuner__field" key={field.key}>
            <span>{field.label}<output>{Number(current[field.key]).toFixed(field.step < 0.01 ? 3 : 1)}{field.unit}</output></span>
            <input type="range" min={field.min} max={field.max} step={field.step} value={current[field.key]}
              onChange={(e) => update(field.key, e.target.value)} />
          </label>
        ))}
      </div>

      <div className="lm-tuner__actions">
        <button className="primary" type="button" onClick={save}>保存调整</button>
        <button type="button" onClick={exportData}>下载参数</button>
        <button type="button" onClick={resetCurrent}>恢复本张</button>
        <button type="button" onClick={resetAll}>全部恢复</button>
      </div>
      <button className="lm-tuner__exit" type="button" onClick={exit}>退出调参模式（关闭控制键）</button>
      <p className="lm-tuner__hint">快捷提示：先调位置和大小，再调“整体显隐”；墨色深度数值越小，画面越深。</p>
      {saved && <div className="lm-tuner__toast">{saved}</div>}
    </aside>
  );
}
