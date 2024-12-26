import { lazy, Suspense, useEffect, useRef } from 'react';

import { useSettings } from '@/store/settingStore';

import type { OnMount, Monaco, EditorProps as MonacoEditorProps } from '@monaco-editor/react';

const MonacoEditor = lazy(() =>
  import('@monaco-editor/react').then((module) => {
    const { loader } = module;

    // 初始化 loader
    loader.config({
      paths: { vs: monacoBaseUrl },
      'vs/nls': {
        availableLanguages: {
          '*': '',
        },
      },
    });

    // 初始化主题
    return loader.init().then((monaco: Monaco) => {
      monaco.editor.defineTheme('custom-light', createThemeData(false));
      monaco.editor.defineTheme('custom-dark', createThemeData(true));
      return { default: module.default };
    });
  }),
);

const monacoBaseUrl = 'https://registry.npmmirror.com/monaco-editor/0.43.0/files/min/vs';

type BuiltinTheme = 'vs' | 'vs-dark' | 'hc-black';

interface KeyBinding {
  keyCode: number;
  keyMod?: number;
  handler: () => void;
  context?: string;
}

const createThemeData = (isDarkMode: boolean) => ({
  base: (isDarkMode ? 'vs-dark' : 'vs') as BuiltinTheme,
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

interface EditorProps extends MonacoEditorProps {
  keybindings?: KeyBinding[];
}

export function Editor({ keybindings = [], onMount, options = {}, ...restProps }: EditorProps) {
  const { themeMode } = useSettings();
  const isDarkMode = themeMode === 'dark';
  const editorRef = useRef<any>(null);
  const theme = isDarkMode ? 'custom-dark' : 'custom-light';

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // 注册所有快捷键
    keybindings.forEach(({ keyCode, keyMod = 0, handler, context }) => {
      editor.addCommand(keyCode + keyMod, handler, context);
    });

    // 调用原始的 onMount
    onMount?.(editor, monaco);
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ theme });
    }
  }, [isDarkMode, theme]);

  return (
    <Suspense fallback={<div>Loading Editor...</div>}>
      <MonacoEditor
        {...restProps}
        theme={theme}
        options={{
          minimap: { enabled: false },
          tabSize: 2,
          fontSize: 14,
          lineHeight: 24,
          padding: { top: 12, bottom: 12 },
          scrollBeyondLastLine: false,
          renderLineHighlight: 'all',
          guides: { indentation: true },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          roundedSelection: true,
          automaticLayout: true,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          ...options,
        }}
        onMount={handleEditorDidMount}
      />
    </Suspense>
  );
}

export default Editor;
