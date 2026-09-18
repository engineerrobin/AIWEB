// src/components/Icon.jsx
import React from 'react';

// 1. ★ 导入所有本地 SVG 文件（作为 React 组件） ★
import { ReactComponent as ThreeD } from '../../assets/icons/3D.svg';
import { ReactComponent as Lottery } from '../../assets/icons/lottery.svg';
import { ReactComponent as AI } from '../../assets/icons/AI.svg';
import{ ReactComponent as Thinking } from '../../assets/icons/thinking.svg';

// 2. ★★★ 核心：建立映射表（字符串 -> 真实的 SVG 组件） ★★★
const iconMap = {
  threeD: ThreeD,
  lottery: Lottery,
  AI: AI,
  thinking: Thinking,
};

// 3. 兜底图标（当传入的字符串在映射表里找不到时显示）
const FallbackIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
    <text x="12" y="16" fontSize="14" textAnchor="middle" fill="currentColor">?</text>
  </svg>
);

const Icon = ({ name, className, style, ...props }) => {
  // 从映射表里取出对应的组件
  const SvgComponent = iconMap[name];
  // console.log(name)
  
  // 如果找不到，显示兜底图标
  if (!SvgComponent) {
    return <FallbackIcon className={className} style={style} />;
  }

  // 渲染真正的 SVG 组件，并透传 className 和 style 方便控制大小和颜色
  return <SvgComponent className={className} style={style} {...props} />;
};
export default Icon;