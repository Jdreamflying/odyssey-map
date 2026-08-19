import { useEffect, useRef } from 'react';
import { MAP_MARKUP } from '../map/markup.js';
import { initOdysseyMap } from '../map/bootMap.js';
import LandmarkLayer from './LandmarkLayer.jsx';
import { applyCartography } from '../map/cartography.js';

/**
 * 互动地图容器（Map V2）。
 *
 * 地图本体是自 6-vibe-coding 原样移植的 vanilla 模块 —— 13 站证据数据、
 * 笔记本、时间尺、夹页、筛选逻辑一字未改。本组件只负责：
 *   1. 顶部安全区（地图内容一律从其下方开始）
 *   2. 插入标记并在挂载后 init 一次
 *   3. 古航海图用的 SVG 滤镜
 *   4. 地点浮现插画层
 *   5. 暴露 host 供主时间轴驱动分阶段显现
 */
export default function OdysseyMap({ registerMapLayers, interactive }) {
  const hostRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || doneRef.current) return;
    doneRef.current = true;

    const mount = host.querySelector('.omap__mount');
    mount.innerHTML = MAP_MARKUP;
    initOdysseyMap();

    /* ── 古典制图层 ──────────────────────────────────────
       在既有 SVG 上叠加历史绘图语言：波特兰恒向线网（隐形圆 + 圆周
       16 朵风玫瑰）、海岸排线、糖块山、河流、聚落、海面点刻与波纹、
       古典地名、欧式风玫瑰。全部为绘制方式，地理数据一字未动。 */
    /* 纯装饰层：任何异常都不允许影响地图本体 */
    try {
      applyCartography(host.querySelector('#map'));
    } catch (err) {
      console.warn('[cartography] 装饰层未能应用，地图功能不受影响:', err);
    }

    /* 题头移入左上小型题记位，不再占据整行 */
    const cart = host.querySelector('.cartouche');
    const slot = host.querySelector('.map-cartouche-slot');
    if (cart && slot) slot.appendChild(cart);

    /* 长论述移入「怎么读这张图」 */
    const thesis = host.querySelector('.cartouche .thesis');
    const howBody0 = host.querySelector('#howbody');
    if (thesis && howBody0) {
      const w = document.createElement('div');
      w.className = 'how-thesis';
      w.innerHTML = thesis.innerHTML;
      howBody0.insertBefore(w, howBody0.firstChild);
      thesis.remove();
    }

    /* 航线线型说明 —— 让路线本身也成为「证据」 */
    const how = host.querySelector('#howbody');
    if (how && !how.querySelector('.how-route')) {
      const box = document.createElement('div');
      box.className = 'how-route';
      box.innerHTML = `
        <h4>航线怎么读</h4>
        <p><b>实线</b>　文本明确的航程关系，且现代地点有较可靠对应。</p>
        <p><b>虚线</b>　文本明确，但地点属后世推测。</p>
        <p><b>断续细线　残骸漂流</b>　被风吹回、或船毁后独自漂流的航段。
        全篇有两处：风袋被解开后从伊萨卡外海被吹回风神岛（卷十）；
        以及宰食太阳神牛后船毁人亡，奥德修斯抱着龙骨被带回卡律布狄斯、
        再漂九日至俄古癸亚（卷十二）。<em>这两段不是船队航行，
        看到断线就说明船上只剩他一个人。</em></p>
        <p><b>斯库拉海峡出现两次，不是三次</b>：第一次是船队正常穿越，
        斯库拉夺去六名同伴；第二次是船毁后被漩涡带回。地图上另有几条线
        经过该海域，那是往返冥府的必经水道，不是又一次遭遇。</p>
        <h4 style="margin-top:18px">关于「神话地理」与「可考地理」</h4>
        <p>地图上原先标注的这两个分区已删除 —— 它容易被误读成地名。
        实际含义是：有些站点（特洛伊、伊斯马罗斯、冥府入口、伊萨卡）
        在古代地理文献与考古中有独立证据；其余多数站点的现代位置
        属后世指认或学术推测。每站的具体等级见右侧铜牌与笔记本。</p>`;
      how.insertBefore(box, how.firstChild);
    }

    /* 图例里的等级说明移入「怎么读这张图」夹页，左下只留交互 */
    const ruleRow = host.querySelector('.legendbox .rule-row');
    const howBody = host.querySelector('#howbody');
    if (ruleRow && howBody) {
      const box = document.createElement('div');
      box.className = 'how-legend';
      box.innerHTML = `<h4>记号怎么读</h4>${ruleRow.innerHTML}`;
      howBody.insertBefore(box, howBody.firstChild);
      ruleRow.remove();
    }

    /* ⚠ 地图**不再参与卷起动画**，因此这里刻意不调用 registerMapLayers。
       ────────────────────────────────────────────────────────────
       原来的做法是把 host 交给主时间轴，由它在 13.0–14.6s 之间把
       --rv-coast / --rv-geo / --rv-route / --rv-nodes / --rv-labels
       从 0 补间到 1，让海岸、山脉、航线、站点、地名依次浮现。

       问题：这五条补间每帧都在改地图整层的 opacity，而地图是 292 环 /
       7250 顶点的海岸线加两层排线 —— 每帧都得重新栅格化。卷纸动画本身
       还要同时跑 clip-path，两件重活撞在一起，卷起那 2.6 秒只有 6 FPS。

       正确的结构是：地图一直在那儿、始终是静态的，卷轴只是盖在它上面的
       一张纸；纸卷走，地图就露出来 —— 不需要任何淡入。

       EpicTimeline 里的那段补间用 `if (M?.host)` 兜底，这里不注册，
       它整段就不执行，所以**不必也没有改动 cinema 时间轴**。
       对应地，map CSS 里所有 var(--rv-*) 乘数都已去掉，改为常量透明度。 */
  }, [registerMapLayers]);

  return (
    <div
      className="omap"
      ref={hostRef}
      aria-hidden={!interactive}
      style={{ pointerEvents: interactive ? 'auto' : 'none' }}
    >
      {/* 古航海图滤镜：给岸线一点不规则的雕版抖动 */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs>
          <filter id="coastRough" x="-4%" y="-4%" width="108%" height="108%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.05" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* 航线的手绘墨感：笔画粗细不匀、边缘轻微抖动，像蘸水笔画在纸上 */}
          <filter id="inkJitter" x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.055 0.09" numOctaves="3" seed="19" result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale="1.15" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* 顶部安全区 */}
      <header className="mapheader">
        <p className="mapheader__title">Ὀδύσσεια · 证据地图</p>
        <p className="mapheader__sub">14 stations · where the evidence actually is</p>
      </header>

      {/* 水印层：在羊皮纸之上、海图与笔记本之下 */}
      <LandmarkLayer />

      {/* 左上小型题记槽 —— 地图从它旁边和下面自然延伸 */}
      <div className="map-cartouche-slot" />

      <div className="omap__mount" />
    </div>
  );
}
