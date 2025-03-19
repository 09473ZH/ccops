import path from 'path';

import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/',
    esbuild: {
      ...(process.env.NODE_ENV === 'production' && {
        drop: ['console', 'debugger'],
        pure: ['console.log'],
      }),
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
    },
    css: {
      devSourcemap: true,
      modules: {
        scopeBehaviour: 'local',
        localsConvention: 'camelCase',
      },
    },
    plugins: [
      react({
        babel: {
          babelrc: false,
          configFile: false,
          plugins: ['@babel/plugin-transform-runtime'],
        },
      }),
      tsconfigPaths(),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
        symbolId: 'icon-[dir]-[name]',
      }),
      sentryVitePlugin({
        org: 'cc-gh',
        project: 'ccops',
        authToken: env.SENTRY_AUTH_TOKEN,
        telemetry: false,
        sourcemaps: {
          assets: './dist/**',
          ignore: ['**/node_modules/**', '**/antd/**', '**/@tanstack/**'],
        },
        release: {
          name: process.env.npm_package_version,
          setCommits: {
            auto: true,
          },
        },
      }),
    ],
    server: {
      open: true,
      host: true,
      port: 3001,
      hmr: {
        overlay: true,
      },
      proxy: {
        '/api': {
          target: 'http://8.141.5.30:83',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    optimizeDeps: {
      include: ['@monaco-editor/react', 'react', 'react-dom', '@ant-design/icons'],
      force: false,
    },
    build: {
      target: 'esnext',
      chunkSizeWarningLimit: 3500,
      minify: 'esbuild',
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'monaco-editor': ['@monaco-editor/react'],
            'antd-core': [
              'antd/es/config-provider',
              'antd/es/theme',
              'antd/es/button',
              'antd/es/space',
              'antd/es/typography',
            ],
            'antd-table': [
              'antd/es/table',
              'antd/es/pagination',
              'antd/es/dropdown',
              'antd/es/menu',
            ],
            'antd-form': ['antd/es/form', 'antd/es/input'],
            'antd-modal': ['antd/es/modal', 'antd/es/drawer'],
            'antd-icons': ['@ant-design/icons'],
            iconify: ['@iconify/react'],
            'common-utils': ['lodash', 'dayjs', '@tanstack/react-query'],
            'common-hooks': ['./src/hooks/use-table', './src/hooks/use-modals-control'],
          },
          chunkFileNames: (chunkInfo) => {
            if (chunkInfo.name.includes('vendor') || chunkInfo.name.includes('antd')) {
              return 'assets/vendor/[name]-[hash].js';
            }
            return 'assets/js/[name]-[hash].js';
          },
          sourcemapExcludeSources: true,
        },
        // https://github.com/vitejs/vite/issues/15012
        onwarn(warning, defaultHandler) {
          if (warning.code === 'SOURCEMAP_ERROR') {
            return;
          }
          defaultHandler(warning);
        },
      },
      cssCodeSplit: true,
      reportCompressedSize: true,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
  };
});
