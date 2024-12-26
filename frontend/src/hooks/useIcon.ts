import { Icon, loadIcon } from '@iconify/react';
import { useEffect } from 'react';

import { ALL_ICONS } from '#/icon';

// 预加载所有静态图标
ALL_ICONS.forEach((icon) => loadIcon(icon));

export const useIcon = (icon: string) => {
  useEffect(() => {
    if (icon) loadIcon(icon);
  }, [icon]);

  return Icon;
};
