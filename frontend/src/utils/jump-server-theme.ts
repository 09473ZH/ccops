import { ThemeNames } from '@/pages/host-manage/config/themes';
import { cn } from '@/utils';

// 主题管理基础函数
export const getCurrentTheme = (): ThemeNames => {
  return (localStorage.getItem('theme') as ThemeNames) || 'Dark';
};

export const setTheme = (theme: ThemeNames) => {
  localStorage.setItem('theme', theme);
};

export const getShortcutKeys = () => {
  const platform =
    import.meta.env.VITE_PLATFORM_OVERRIDE || (navigator?.userAgent || '').toLowerCase();

  if (platform.includes('mac')) {
    return {
      search: '⌘F',
      clear: '⌘L',
      reconnect: '⌘R',
    };
  }
  if (platform.includes('win')) {
    return {
      search: 'Ctrl+F',
      clear: 'Ctrl+L',
      reconnect: 'Ctrl+R',
    };
  }
  return {
    search: 'Ctrl+F',
    clear: 'Ctrl+L',
    reconnect: 'Ctrl+R',
  };
};

// 获取样式
export const getStyles = (theme: ThemeNames) => {
  const prefix = `terminal-${theme.toLowerCase()}`;
  const shortcuts = getShortcutKeys();

  // 修改按钮样式函数
  const getButtonStyle = (size: 'small' | 'normal' = 'normal') =>
    cn(
      'flex items-center gap-1 rounded transition-colors duration-200',
      {
        // 尺寸
        'px-2 py-0.5 text-sm': size === 'small',
        'px-2 py-1 text-sm': size === 'normal',
      },
      {
        // 主题样式
        'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50': theme === 'Dark',
        'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50': theme === 'Light',
        'bg-[#d5ccbf]/50 text-terminal-retro-text hover:bg-[#e5e1d8]/50': theme === 'Retro',
      },
    );

  // 修改选择器样式函数
  const getSelectStyle = () =>
    cn(
      'flex items-center gap-1 rounded transition-colors duration-200',
      'cursor-pointer appearance-none outline-none',
      'px-3 py-1 text-sm pr-8',
      'border',
      {
        // 主题样式 - 与按钮样式保持一致
        'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/50': theme === 'Dark',
        'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50 border-gray-300/50': theme === 'Light',
        'bg-[#d5ccbf]/50 text-terminal-retro-text hover:bg-[#e5e1d8]/50 border-[#45373a]/20':
          theme === 'Retro',
      },
    );

  // 抽象图标按钮样式
  const getIconButtonStyle = (size: number) =>
    cn(
      'flex items-center justify-center rounded transition-colors duration-150',
      `h-${size} w-${size}`,
      {
        'bg-terminal-dark-button text-terminal-dark-text hover:bg-terminal-dark-button-hover':
          theme === 'Dark',
        'bg-terminal-light-button text-terminal-light-text hover:bg-terminal-light-button-hover':
          theme === 'Light',
        'bg-terminal-retro-button text-terminal-retro-text hover:bg-terminal-retro-button-hover':
          theme === 'Retro',
      },
    );

  return {
    // 主容器
    container: cn('flex flex-col h-screen w-full', {
      [`bg-${prefix}-bg`]: true,
    }),

    // 标题栏
    header: {
      container: cn('flex items-center justify-between border-b px-6 py-3', {
        [`border-${prefix}-border bg-${prefix}-header text-${prefix}-text`]: true,
      }),
      left: {
        container: 'flex items-center space-x-4',
        time: cn('w-[80px] text-sm tabular-nums', {
          [`text-${prefix}-text`]: true,
        }),
        text: cn('text-sm', {
          [`text-${prefix}-text`]: true,
        }),
        sshStatus: cn('flex items-center space-x-2', {
          [`text-${prefix}-text`]: true,
        }),
        dot: (isConnected: boolean) =>
          cn(
            'h-2 w-2 rounded-full transition-colors duration-200',
            isConnected ? 'bg-green-500' : 'bg-red-500',
          ),
        button: getButtonStyle('small'),
        shortcut: 'opacity-60 ml-1',
      },
      right: {
        container: 'flex items-center space-x-4',
        fontSelector: {
          container: 'flex items-center space-x-2',
          select: getSelectStyle(), // 使用新的选择器样式
        },
        themeSelector: {
          container: 'relative inline-block',
          select: getSelectStyle(), // 使用新的选择器样式
        },
        fontSizeButton: {
          container: 'flex items-center space-x-2',
          button: getButtonStyle('small'),
          text: cn('text-xs mx-2 w-[40px] text-center tabular-nums', {
            'text-terminal-dark-text': theme === 'Dark',
            'text-terminal-light-text': theme === 'Light',
            'text-terminal-retro-text': theme === 'Retro',
          }),
        },
      },
    },

    // 标签栏
    tabBar: {
      container: cn('flex h-10 items-end space-x-1 px-2', {
        'bg-terminal-dark-toolbar': theme === 'Dark',
        'bg-terminal-light-toolbar': theme === 'Light',
        'bg-terminal-retro-toolbar': theme === 'Retro',
      }),
      tab: (isActive: boolean) =>
        cn(
          'group relative flex h-9 min-w-[140px] max-w-[240px] items-center rounded-t-lg px-3',
          'transition-all duration-200',
          {
            // 活动标签 - 增加对比度
            'bg-terminal-dark-button text-terminal-dark-text': isActive && theme === 'Dark',
            'bg-terminal-light-button text-terminal-light-text ': isActive && theme === 'Light',
            'bg-terminal-retro-button text-terminal-retro-text': isActive && theme === 'Retro',

            // 非活动标签
            'hover:bg-gray-700/50 text-gray-600': !isActive && theme === 'Dark',
            'hover:bg-gray-200/50 text-gray-600': !isActive && theme === 'Light',
            'hover:bg-[#d5ccbf]/50 text-terminal-retro-text/60': !isActive && theme === 'Retro',
          },
          // 添加边框效果
          {
            'border-t border-l border-r border-gray-700/50': isActive && theme === 'Dark',
            'border-t border-l border-r border-gray-300/50': isActive && theme === 'Light',
            'border-t border-l border-r border-[#45373a]/20': isActive && theme === 'Retro',
          },
        ),
      title: 'flex-1 truncate text-sm',
      closeButton: cn(
        'ml-2 flex h-5 w-5 items-center justify-center rounded-full text-xs',
        'transition-all duration-200 opacity-0 group-hover:opacity-100',
        {
          'hover:bg-gray-700 text-gray-400 hover:text-gray-200': theme === 'Dark',
          'hover:bg-gray-200 text-gray-600 hover:text-gray-800': theme === 'Light',
          'hover:bg-[#d5ccbf] text-[#45373a]/80 hover:text-[#45373a]': theme === 'Retro',
        },
      ),
      addButton: cn(
        'flex h-9 w-9 items-center justify-center rounded-lg text-lg',
        'transition-colors duration-200',
        {
          'text-gray-400 hover:bg-gray-700/30 hover:text-gray-200': theme === 'Dark',
          'text-gray-600 hover:bg-gray-200/30 hover:text-gray-800': theme === 'Light',
          'text-terminal-retro-text hover:bg-[#d5ccbf]/30 hover:text-terminal-retro-text':
            theme === 'Retro',
        },
      ),
    },

    // 终端区域
    terminal: {
      container: 'flex-1 px-6 py-4 min-h-0',
      wrapper: cn('h-full w-full overflow-hidden rounded-lg border', {
        'border-terminal-dark-border bg-terminal-dark-term': theme === 'Dark',
        'border-terminal-light-border bg-terminal-light-term': theme === 'Light',
        'border-terminal-retro-border bg-terminal-retro-term': theme === 'Retro',
      }),
      session: (isActive: boolean) =>
        cn('relative h-full rounded-lg p-2', isActive ? 'block' : 'hidden'),
      xterm: (isActive: boolean) =>
        cn('h-full w-full rounded-md', isActive ? 'visible' : 'invisible absolute'),
    },

    // 底部工具栏
    footer: {
      container: cn('flex items-center justify-between px-6 py-3', {
        'bg-terminal-dark-header text-terminal-dark-text': theme === 'Dark',
        'bg-terminal-light-header text-terminal-light-text': theme === 'Light',
        'bg-terminal-retro-header text-terminal-retro-text': theme === 'Retro',
      }),
      buttonGroup: 'flex items-center space-x-6',
      button: getButtonStyle('normal'),
    },

    // 添加主机选择器样式
    hostSelector: {
      overlay: 'fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-[20vh]',
      container: cn('w-[600px] overflow-hidden rounded-lg shadow-2xl', {
        'bg-terminal-dark-bg border-terminal-dark-border': theme === 'Dark',
        'bg-terminal-light-bg border-terminal-light-border': theme === 'Light',
        'bg-terminal-retro-bg border-terminal-retro-border': theme === 'Retro',
      }),
      input: cn('w-full border-b px-4 py-3 outline-none', {
        'border-terminal-dark-border bg-terminal-dark-toolbar text-terminal-dark-text':
          theme === 'Dark',
        'border-terminal-light-border bg-terminal-light-toolbar text-terminal-light-text':
          theme === 'Light',
        'border-terminal-retro-border bg-terminal-retro-toolbar text-terminal-retro-text':
          theme === 'Retro',
      }),
      list: 'max-h-[400px] overflow-y-auto',
      item: (isActive: boolean) =>
        cn('flex cursor-pointer items-center px-4 py-3', 'transition-colors duration-150', {
          [`bg-${prefix}-primary text-white`]: isActive,
          [`hover:bg-${prefix}-hoverBg`]: !isActive,
          'text-terminal-dark-text hover:bg-white/5': !isActive && theme === 'Dark',
          'text-terminal-light-text hover:bg-black/5': !isActive && theme === 'Light',
          'text-terminal-retro-text hover:bg-[#e5e1d8]/5': !isActive && theme === 'Retro',
        }),
      itemTitle: cn('font-medium', {
        'text-terminal-dark-text': theme === 'Dark',
        'text-terminal-light-text': theme === 'Light',
        'text-terminal-retro-text': theme === 'Retro',
      }),
      itemSubtitle: (isActive: boolean) => ({
        color: isActive
          ? 'rgba(255, 255, 255, 0.6)'
          : {
              Dark: '#808080',
              Light: '#666666',
              Retro: '#918175',
            }[theme],
      }),
    },

    // 导出通用按钮样式供外部使用
    button: {
      normal: getButtonStyle('normal'),
      small: getButtonStyle('small'),
      icon: getIconButtonStyle,
    },

    // 添加快捷键相关样式
    shortcuts,
  };
};
