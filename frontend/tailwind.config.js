/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '480px',
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      '2xl': '1600px',
    },
    colors: {
      // 主色系统 - 使用橙色作为品牌色
      primary: {
        light: '#FFF3E0', // 最浅色调
        main: '#FF9800', // 主要品牌色
        dark: '#F57C00', // 深色调
        contrast: '#FFFFFF', // 对比色（用于文字）
      },
      // 辅助色系统
      secondary: {
        light: '#F5F5F5',
        main: '#637381', // 中性灰，用于次要元素
        dark: '#2D3843',
        contrast: '#FFFFFF',
      },
      // 功能色系统
      functional: {
        success: '#4CAF50', // 成功
        warning: '#FFA726', // 警告
        error: '#F44336', // 错误
        info: '#2196F3', // 信息
      },
      // 中性色系统
      neutral: {
        0: '#FFFFFF',
        100: '#F9FAFB',
        200: '#F4F6F8',
        300: '#DFE3E8',
        400: '#C4CDD5',
        500: '#919EAB',
        600: '#637381',
        700: '#454F5B',
        800: '#212B36',
        900: '#161C24',
      },
      // 状态交互色
      state: {
        hover: 'rgba(255, 152, 0, 0.08)', // 主色悬浮态
        selected: 'rgba(255, 152, 0, 0.16)', // 主色选中态
        disabled: 'rgba(0, 0, 0, 0.12)', // 禁用态
      },
      // 基础
      black: '#000',
      green: '#00A76F',
      blue: '#1fb6ff',
      purple: '#7e5bef',
      pink: '#ff49db',
      orange: '#ff7849',
      yellow: '#ffc82c',
      gray: '#637381',
      code: '#d63384',
      // 色阶
      ...Array.from({ length: 9 }, (_, i) => i + 1).reduce(
        (acc, num) => ({
          ...acc,
          [`orange-${num}00`]: [
            '#FCEED8',
            '#FFE0B2',
            '#FFCC80',
            '#FFB74D',
            '#FFA726',
            '#FF9800',
            '#FB8C00',
            '#F57C00',
            '#EF6C00',
          ][num - 1],
          [`green-${num}00`]: [
            '#E8F5E9',
            '#C8E6C9',
            '#A5D6A7',
            '#81C784',
            '#66BB6A',
            '#4CAF50',
            '#43A047',
            '#388E3C',
            '#2E7D32',
          ][num - 1],
          [`gray-${num}00`]: [
            '#F5F5F5',
            '#EEEEEE',
            '#E0E0E0',
            '#BDBDBD',
            '#9E9E9E',
            '#757575',
            '#616161',
            '#424242',
            '#212121',
          ][num - 1],
        }),
        {},
      ),
      // 渐变
      violet: {
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
      },
      fuchsia: {
        400: '#e879f9',
        500: '#d946ef',
      },
      // Terminal Dark Theme
      'terminal-dark': {
        bg: '#1e1e1e',
        header: '#2d2d2d',
        toolbar: '#252525',
        border: '#404040',
        button: '#333333',
        term: '#282c34',
        text: '#d4d4d4',
        textDim: '#909090',
      },

      // Terminal Light Theme
      'terminal-light': {
        bg: '#ffffff',
        header: '#f5f5f5',
        toolbar: '#f0f0f0',
        border: '#e0e0e0',
        button: '#ffffff',
        term: '#f8f9fa',
        text: '#2c2c2c',
        textDim: '#666666',
      },

      // Terminal Retro Theme
      'terminal-retro': {
        bg: '#2b2b2b',
        header: '#323232',
        toolbar: '#2f2f2f',
        border: '#3d3d3d',
        button: '#363636',
        term: '#2d2b27', // 和终端主题的背景色一致
        text: '#e8e8e8',
        textDim: '#a0a0a0',
      },
    },
    extend: {
      transitionProperty: {
        height: 'height',
      },
      keyframes: {
        'magic-sparkle': {
          '0%, 100%': { opacity: '1', transform: 'rotate(0deg)' },
          '25%': { opacity: '0.8', transform: 'rotate(-4deg)' },
          '75%': { opacity: '0.9', transform: 'rotate(4deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'magic-sparkle': 'magic-sparkle 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        fadeIn: 'fadeIn 0.3s ease-in-out forwards',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [
    function terminalThemePlugin({ addComponents }) {
      addComponents({
        '.terminal-theme': {
          '& button': {
            all: 'unset',
            cursor: 'pointer',
          },
        },
      });
    },
  ],
};
