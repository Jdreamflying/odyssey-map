/**
 * 场景插图生成服务 —— 预留接口
 *
 * 当前阶段不接入任何 AI 图片生成 API。
 * 所有 Scene 的插图都使用 assets/generated 下的占位资源，
 * 以及内置的铜版画风 SVG 线稿（见 scenes/* 的 background/foreground）。
 *
 * 后续接入时只需：
 *   1. 在本文件内实现真实请求；
 *   2. 在 scenes 配置里把 background.image / foreground.image 置为
 *      调用 generateSceneImage(prompt) 返回的 URL；
 *   3. 从 <img> 占位切换为真实图源（Scene.jsx 已做兼容，见 imageSrc 判断）。
 *
 * 同一 prompt 建议做一层缓存，避免反复调用付费接口。
 */

const _promptCache = new Map();

/**
 * 根据场景提示词生成一张场景插图。
 *
 * @param {string} prompt 描述画面内容的提示词
 * @param {object} [options]
 * @param {'square'|'wide'|'tall'} [options.aspect] 画面比例
 * @param {string} [options.style] 风格关键词（默认"antique copperplate engraving, sepia, monochrome ink"）
 * @returns {Promise<string|null>} 图片 URL；接口尚未接入时返回 null
 */
export async function generateSceneImage(prompt, options = {}) {
  // TODO:
  // Connect AI image generation API later.
  //
  // 接入模板：
  //   const key = `${options.aspect ?? 'wide'}::${prompt}`;
  //   if (_promptCache.has(key)) return _promptCache.get(key);
  //   const url = await yourImageApiClient.request({
  //     prompt,
  //     aspect_ratio: options.aspect ?? 'wide',
  //     style: options.style ?? 'antique copperplate engraving, sepia, monochrome ink',
  //   });
  //   _promptCache.set(key, url);
  //   return url;

  void options;
  void _promptCache;
  return null;
}

/**
 * 场景层插图：背景层（远景）与前景层（近景）各生成一张。
 * 未接入时全部返回 null，Scene 组件会退回内置 SVG 线稿。
 *
 * @param {object} scene scene 配置（含 id、title 等）
 * @returns {Promise<{background: string|null, foreground: string|null}>}
 */
export async function generateSceneLayers(scene) {
  const style =
    'antique copperplate engraving, 18th century archaeological illustration, ' +
    'monochrome ink drawing, sepia and black, high detail crosshatching';

  const [background, foreground] = await Promise.all([
    generateSceneImage(`wide background: ${scene.background.prompt}`, {
      aspect: 'wide',
      style,
    }),
    generateSceneImage(`foreground: ${scene.foreground.prompt}`, {
      aspect: 'wide',
      style,
    }),
  ]);

  return { background, foreground };
}
