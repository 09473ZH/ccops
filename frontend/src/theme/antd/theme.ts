import { ThemeConfig } from 'antd';
/**
 * Antd theme editor: https://ant.design/theme-editor-cn
 */
const customThemeTokenConfig: ThemeConfig['token'] = {
  colorSuccess: '#22c55e',
  colorWarning: '#ff7849',
  colorError: '#ff5630',
  colorInfo: '#00b8d9',

  // 线性化
  wireframe: false,

  borderRadiusSM: 2,
  borderRadius: 4,
  borderRadiusLG: 8,
};

const customComponentConfig: ThemeConfig['components'] = {
  Breadcrumb: {
    fontSize: 16,
    separatorMargin: 4,
  },
  Menu: {
    fontSize: 14,
    colorFillAlter: 'transparent',
    itemColor: 'rgb(145, 158, 171)',
    motionDurationMid: '0.125s',
    motionDurationSlow: '0.125s',
  },
};

const colorPrimarys: {
  default: string;
} = {
  default: '#FF9800',
};

const themeModeToken: Record<'dark' | 'light', ThemeConfig> = {
  dark: {
    token: {
      colorBgLayout: '#161c24',
      colorBgContainer: '#212b36',
      colorBgElevated: '#161c24',
    },
    components: {
      Layout: {
        siderBg: '#161c24',
      },
      Menu: {
        darkItemBg: '#161c24',
      },
      Modal: {
        headerBg: '#212b36',
        contentBg: '#212b36',
        footerBg: '#212b36',
      },
      Notification: {},
    },
  },
  light: {
    components: {
      Layout: {
        siderBg: '#161c24',
      },
      Menu: {
        darkItemBg: '#161c24',
      },
    },
  },
};

export { customThemeTokenConfig, customComponentConfig, colorPrimarys, themeModeToken };
