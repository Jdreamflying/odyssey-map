# Odyssey: The Lost Voyage — 奥德赛 · 失落航程

一卷会动的古希腊铜版画长卷。滚动，是在翻阅一部正在展开的史诗。

五幕（外加一段可选的终章）：

- **Ⅰ 特洛伊** — 城破之夜，木马静立
- **Ⅱ 十年** — 滩头军阵，望不到头的荒芜
- **Ⅲ 酒色的海** — 没有航线的航行
- **Ⅳ 独眼巨人** — 我的名字叫「无人」
- **Ⅴ 波塞冬** — 每一朵浪都带着神的名字
- **Ⅵ 伊萨卡**（可选收尾）— 长卷的另一端是家

## 快速开始

```bash
npm install
npm run dev      # 本地开发 http://localhost:5173
npm run build    # 产物输出到 dist/
npm run preview  # 预览构建产物
```

## 结构

```
src/
  components/
    EpicTimeline.jsx   # 串联所有 Scene（含可选 epilogue）
    Scene.jsx          # 单幕：进入 → 停留 → 离开 + 镜头 + 粒子
    AncientMap.jsx     # 航程铜版小图，随滚动绘制航线、小船前行
    Navigation.jsx     # 卷章导航，点击跳转
  scenes/
    TroyScene.js       # 场景配置：文案 + 铜版线稿（SVG）+ AI 提示词
    WarScene.js
    OceanScene.js
    CyclopsScene.js
    PoseidonScene.js
    EpilogueScene.js   # 可选终章，删除 EpicTimeline 中的引用即可去掉
    engraving.js       # 共享雕刻工具：排线图案、希腊回纹
  services/
    imageGeneration.js # AI 图片生成空接口（预留）
  assets/generated/    # 场景插图占位目录
```

## 每幕动画（全部由滚动控制，不自动播放）

每幕由 GSAP `ScrollTrigger` 固定（pin），随滚动依序执行：

| 阶段 | 时长占比 | 动画 |
|---|---|---|
| 进入 | 22% | `opacity 0→1`，`scale 1.15→1`，`blur 20px→0` |
| 停留 | 52% | 画面静止，背景/前景按各自 `camera` 相向漂移（视差镜头） |
| 离开 | 26% | `opacity 1→0`，`x 0→-240px` |

卷首题名、提示线、每幕粒子（灰烬/尘土/飞沫/雨丝/落叶）同样挂进
ScrollTrigger 时间轴——**全部动画都由滚动控制，无任何自动播放**。
滚动即回放，回滚即倒放。

## 接入 AI 图片

`services/imageGeneration.js` 目前只有空接口。接入后把场景里的
`background.art` / `foreground.art` 换成 `background.image` 即可，
`Scene.jsx` 会自动优先用 `<img>`。详见 `src/assets/generated/README.md`。

## 技术细节

- React 18 + GSAP 3 + ScrollTrigger（Vite 构建）
- 字体自托管：GFS Didot / GFS Neohellenic / Source Han Serif SC（woff2 子集）
- 无外部 CDN、无外链，`dist/` 可直接部署到任意静态站点子路径
- 尊重 `prefers-reduced-motion`（粒子静止）
- 竖屏自适应：文字牌落底，航程小图隐藏
