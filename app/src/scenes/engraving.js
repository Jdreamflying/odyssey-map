/**
 * 铜版画雕刻工具 —— 供所有场景 SVG 线稿共享。
 *
 * 所有图案均为纯墨线（stroke），颜色统一，靠排线密度区分明暗；
 * 容器层会用 CSS 的 sepia / contrast 把墨色统一染成仿古暖褐。
 */

export const INK = '#21180d';
export const INK_SOFT = '#4a3a24';
export const INK_FAINT = '#7d6a4c';

/**
 * 共享雕刻排线图案。
 *
 * 每个以字符串形式嵌入的线稿（scene art）都自带一套 <defs>；
 * 需要以 React JSX 形式渲染 SVG 的地方（如 AncientMap）则用
 * engravePatterns() 注入 <defs> 的内部内容。
 */
export function engravePatterns() {
  return `
    <pattern id="hatch-diag" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="7" stroke="${INK}" stroke-width="0.9" opacity="0.5"/>
    </pattern>
    <pattern id="hatch-criss" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="9" stroke="${INK}" stroke-width="0.8" opacity="0.38"/>
      <line x1="0" y1="0" x2="9" y2="0" stroke="${INK}" stroke-width="0.8" opacity="0.38"/>
    </pattern>
    <pattern id="hatch-horiz" width="5" height="5" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="5" y2="0" stroke="${INK}" stroke-width="0.8" opacity="0.4"/>
    </pattern>
    <pattern id="hatch-vert" width="5" height="5" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="5" stroke="${INK}" stroke-width="0.8" opacity="0.4"/>
    </pattern>
    <pattern id="hatch-wave" width="16" height="8" patternUnits="userSpaceOnUse">
      <path d="M0 4 q4 -3.5 8 0 t8 0" fill="none" stroke="${INK}" stroke-width="0.9" opacity="0.5"/>
    </pattern>
    <pattern id="hatch-dots" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="0.9" fill="${INK}" opacity="0.5"/>
    </pattern>`;
}

export function engraveDefs() {
  return `<defs>${engravePatterns()}</defs>`;
}

/**
 * 希腊回纹（meander）连续饰边，用于分隔线与边框。
 * @param {number} width 饰边总宽
 * @param {number} u 单个小回纹单元半宽
 * @returns {string} <path d="..."> 片段，原点在 (0,9)，高约 18
 */
export function meander(width, u = 6) {
  const n = Math.max(1, Math.floor(width / (5 * u)));
  const unit = `h${u} v-${2 * u} h${2 * u} v${4 * u} h${2 * u} v-${2 * u} `;
  return `M0 9 ${unit.repeat(n)}`;
}

/**
 * 排线填充块：快速给一块区域铺上平行排线。
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} [step=7] 线距
 * @returns {string} 一组 <line> 元素
 */
export function hatchArea(x, y, w, h, step = 7) {
  const lines = [];
  const count = Math.floor(h / step);
  for (let i = 0; i <= count; i++) {
    const ly = y + i * step;
    lines.push(`<line x1="${x}" y1="${ly}" x2="${x + w}" y2="${ly}" stroke="${INK}" stroke-width="0.8" opacity="0.4"/>`);
  }
  return lines.join('\n');
}
