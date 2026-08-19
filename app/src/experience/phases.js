/**
 * 体验阶段 —— 全站唯一的阶段状态源。
 *
 *   prologue    卷首题名浮现，长卷尚未真正开始
 *   timeline    十二幕正在推进
 *   homecoming  伊萨卡定影 → 铜版褪成羊皮纸 → 地图自纸中掀开
 *   map         互动地图已完全展开，交还给用户
 *
 * 阶段由主时间轴的 progress 推导，不另设 boolean 开关。
 */
export const PHASE = {
  PROLOGUE: 'prologue',
  TIMELINE: 'timeline',
  HOMECOMING: 'homecoming',
  MAP: 'map',
};

/** 阶段分界（主时间轴归一化进度） */
export const PHASE_AT = {
  timeline: 0.050,
  homecoming: 0.862,
  /* 略早于 1.0：scrub 有阻尼，progress 是渐近逼近 1 的，
     卡在 0.9995 会让地图永远点不动。此时标签仍在浮现，不影响观感。 */
  map: 0.996,
};

export function phaseForProgress(p) {
  if (p >= PHASE_AT.map) return PHASE.MAP;
  if (p >= PHASE_AT.homecoming) return PHASE.HOMECOMING;
  if (p >= PHASE_AT.timeline) return PHASE.TIMELINE;
  return PHASE.PROLOGUE;
}

/**
 * 归乡段的内部刻度。全部挂在同一条主时间轴上，
 * 因此地图的分阶段显现同样由滚动 / 自动推进驱动。
 */
export const HOMECOMING = {
  ithakaIn:    [0.880, 0.905],   // ΙΘΑΚΗ 浮现
  ithakaHold:  [0.905, 0.930],   // 停留 —— 全篇最重要的一次文字
  ithakaOut:   [0.930, 0.950],
  toParchment: [0.945, 0.970],   // 铜版褪成羊皮纸
  mapUnfold:   [0.955, 0.995],   // 纸面掀开
  mapPaper:    [0.955, 0.975],
  mapCoast:    [0.965, 0.978],
  mapGeo:      [0.972, 0.986],
  mapRoute:    [0.980, 0.991],
  mapNodes:    [0.986, 0.996],
  mapLabels:   [0.992, 1.000],
};
