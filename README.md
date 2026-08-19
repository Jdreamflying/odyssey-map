# 奥德赛 · 失落航程

一张以 17–18 世纪欧洲铜版航海图为视觉语法的《奥德赛》交互地图，包含序幕影片、十四站航线、考据笔记、Landmark 铜版画水印与古地图装饰层。

## 在线页面

GitHub Pages：<https://jdreamflying.github.io/odyssey-map/>

## Landmark 私人调参模式

在正式网址后加：

```text
?tune=landmarks
```

完整地址：<https://jdreamflying.github.io/odyssey-map/?tune=landmarks>

调参台可以逐张控制：

- 水平 / 垂直位置
- 图片大小
- 整体显隐
- 墨色深度
- 贴图透明度
- 轻微旋转

“保存调整”写入当前浏览器；“下载参数”会生成 `odyssey-landmark-presets.json`。普通访客网址默认不显示控制键。

## 仓库结构

- 仓库根目录：已构建的 GitHub Pages 成品
- `app/`：完整 Vite / React 源码

## 本地开发

```bash
cd app
npm install
npm run dev
npm run build
```

## 本次更新

- 14 站 Landmark 独立 preset 与完整视口约束
- Landmark 私人实时调参台
- 古地图 AssetLayer、真实地理装饰、风玫瑰与拉丁边注
- Landmark 延后预载，避免与序幕影片争抢带宽
- 根目录保留可直接发布的静态成品

## 资源加载优化

线上运行时使用 WebP：序幕约 4.31 MB、Landmark 约 6.85 MB、羊皮纸约 0.49 MB。PNG 原始母版保留在 `app/public/`，构建后自动从发布目录剔除，当前 Pages 成品约 16.44 MB。
