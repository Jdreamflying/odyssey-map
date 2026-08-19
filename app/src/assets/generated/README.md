# assets/generated — 场景插图占位目录

当前阶段**不接入 AI 图片生成**，所有场景插图使用内置的铜版画风 SVG 线稿
（写在 `src/scenes/*Scene.js` 的 `background.art` / `foreground.art` 里）。

## 以后接入 AI 图片时

1. 在 `src/services/imageGeneration.js` 里实现 `generateSceneImage(prompt)`；
2. 把生成的图片文件放进本目录（或远程 URL）；
3. 在对应场景配置里把 `background.art` / `foreground.art` 替换为
   `background.image` / `foreground.image`，例如：

```js
background: {
  prompt: '暮色下的特洛伊城墙……',
  image: '/assets/generated/troy-bg.png', // 替代 art
  camera: { x: 120, y: 0, scale: 1.07 },
},
```

`Scene.jsx` 已做好兼容：`image` 存在时渲染 `<img>`，否则回退到 `art`（SVG 线稿）。
