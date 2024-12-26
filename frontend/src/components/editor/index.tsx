import { loader, type OnMount, EditorProps as MonacoEditorProps } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useEffect, useRef, lazy } from 'react';

import { useSettings } from '@/store/settingStore';

// 懒加载 MonacoEditor
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

// CDN 配置
const monacoBaseUrl = 'https://registry.npmmirror.com/monaco-editor/0.43.0/files/min/vs';

// 主题配置
const createThemeData = (isDarkMode: boolean) => ({
  base: isDarkMode ? 'vs-dark' : 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6a9955' },
    { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
    { token: 'string', foreground: 'ce9178' },
  ],
  colors: {
    'editor.background': isDarkMode ? '#1e1e1e' : '#ffffff',
    'editor.foreground': isDarkMode ? '#d4d4d4' : '#000000',
    'editor.lineHighlightBackground': isDarkMode ? '#2d2d2d' : '#f7f7f7',
    'editorLineNumber.foreground': isDarkMode ? '#858585' : '#999999',
  },
});

// 默认编辑器选项
const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  tabSize: 2,
  fontSize: 14,
  lineHeight: 24,
  padding: { top: 12, bottom: 12 },
  scrollBeyondLastLine: false,
  renderLineHighlight: 'all',
  guides: { indentation: true },
  smoothScrolling: true,
  cursorBlinking: 'smooth' as const,
  cursorSmoothCaretAnimation: 'on',
  roundedSelection: true,
  automaticLayout: true,
  wordWrap: 'on',
  formatOnPaste: true,
  formatOnType: true,
};

// 初始化 Monaco
const initializeMonaco = async () => {
  if (!(window as any).monacoInitialized) {
    (window as any).monacoInitialized = true;
    loader.config({ paths: { vs: monacoBaseUrl } });
    const monaco = await loader.init();
    monaco.editor.defineTheme('custom-light', createThemeData(false) as any);
    monaco.editor.defineTheme('custom-dark', createThemeData(true) as any);
  }
};

// 类型定义
interface KeyBinding {
  keyCode: number;
  keyMod?: number;
  handler: () => void;
  context?: string;
}

interface EditorProps extends Omit<MonacoEditorProps, 'theme'> {
  keybindings?: KeyBinding[];
}

// 编辑器组件
export function Editor({ keybindings = [], onMount, options = {}, ...restProps }: EditorProps) {
  const { themeMode } = useSettings();
  const editorRef = useRef<any>(null);
  const isDarkMode = themeMode === 'dark';
  const theme = isDarkMode ? 'custom-dark' : 'custom-light';

  // 初始化 Monaco
  useEffect(() => {
    initializeMonaco();
  }, []);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    keybindings.forEach(({ keyCode, keyMod = 0, handler, context }) => {
      editor.addCommand(keyCode + keyMod, handler, context);
    });
    onMount?.(editor, monaco);
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ theme });
    }
  }, [isDarkMode, theme]);

  return (
    <MonacoEditor
      {...restProps}
      theme={theme}
      options={{ ...defaultOptions, ...options }}
      onMount={handleEditorDidMount}
    />
  );
}

export default Editor;
