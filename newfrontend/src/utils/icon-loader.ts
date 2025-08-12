import { loadIcon } from '@iconify/react';

// 文件图标
const FILE_ICONS = [
  'catppuccin:markdown',
  'catppuccin:python',
  'catppuccin:javascript',
  'catppuccin:powershell',
  'catppuccin:json',
  'catppuccin:yaml',
  'catppuccin:xml',
  'catppuccin:text',
  'catppuccin:database',
  'catppuccin:file',
];

// 操作系统图标
const OS_ICONS = [
  'logos:ubuntu',
  'logos:centos-icon',
  'logos:debian',
  'logos:fedora',
  'logos:archlinux',
  'logos:microsoft-windows-icon',
  'logos:apple',
  'logos:linux-tux',
  'logos:redhat-icon',
  'logos:suse',
  'logos:linux-mint',
  'logos:manjaro',
];

export const preloadIcons = async (icons: string[]) => {
  return Promise.all(
    icons.map((icon) =>
      loadIcon(icon).catch((err) => {
        console.error(`Failed to preload icon: ${icon}`, err);
      }),
    ),
  );
};

// 预加载所有静态图标
preloadIcons([...FILE_ICONS, ...OS_ICONS]);

// 导出用于动态加载单个图标的函数
export const preloadIcon = async (icon: string) => {
  if (!icon) return;
  await loadIcon(icon).catch((err) => {
    console.error(`Failed to preload icon: ${icon}`, err);
  });
};
