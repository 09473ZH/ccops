import React from 'react';
import ReactDiffViewer, { ReactDiffViewerStylesOverride } from 'react-diff-viewer-continued';

import { useSettings } from '@/store/setting';

interface DiffViewerProps {
  oldValue: string;
  newValue: string;
  oldTitle?: string;
  newTitle?: string;
}

const getDiffViewerStyles = (isDarkMode: boolean): ReactDiffViewerStylesOverride => {
  return {
    variables: {
      light: {
        diffViewerBackground: '#fff',
        diffViewerColor: '#212529',
        addedBackground: '#e6ffed',
        addedColor: '#24292e',
        removedBackground: '#ffeef0',
        removedColor: '#24292e',
        wordAddedBackground: '#acf2bd',
        wordRemovedBackground: '#fdb8c0',
        addedGutterBackground: '#cdffd8',
        removedGutterBackground: '#ffdce0',
        gutterBackground: '#f7f7f7',
        gutterBackgroundDark: '#f3f1f1',
        highlightBackground: '#fffbdd',
        highlightGutterBackground: '#fff5b1',
      },
      dark: {
        diffViewerBackground: '#2d333b',
        diffViewerColor: '#e6edf3',
        addedBackground: 'rgba(87, 171, 90, 0.15)',
        addedColor: '#e6edf3',
        removedBackground: 'rgba(248, 81, 73, 0.15)',
        removedColor: '#e6edf3',
        wordAddedBackground: 'rgba(87, 171, 90, 0.4)',
        wordRemovedBackground: 'rgba(248, 81, 73, 0.4)',
        addedGutterBackground: 'rgba(87, 171, 90, 0.2)',
        removedGutterBackground: 'rgba(248, 81, 73, 0.2)',
        gutterBackground: '#2d333b',
        gutterBackgroundDark: '#2d333b',
        highlightBackground: '#fffbdd',
        highlightGutterBackground: '#fff5b1',
      },
    },
    contentText: {
      fontSize: '12px',
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
      padding: '0 10px',
      '& pre': {
        margin: 0,
        lineHeight: '20px',
      },
    },
    gutter: {
      padding: '0 10px',
      minWidth: '2.5rem',
      userSelect: 'none',
      textAlign: 'right',
      '& > pre': {
        margin: 0,
        lineHeight: '20px',
      },
    },
    line: {
      position: 'relative',
      minHeight: '20px',
      '& pre': {
        lineHeight: '20px',
      },
      '&:hover': {
        background: isDarkMode ? '#343942' : '#f7f7f7',
      },
    },
    wordDiff: {
      padding: '0 1px',
      borderRadius: '2px',
    },
    titleBlock: {
      padding: '4px 12px',
      background: isDarkMode ? '#343942' : '#f7f7f7',
      borderBottom: `1px solid ${isDarkMode ? '#444c56' : '#e1e4e8'}`,
    },
  };
};

export function DiffViewer({
  oldValue,
  newValue,
  oldTitle = '旧版本',
  newTitle = '新版本',
}: DiffViewerProps) {
  const { themeMode } = useSettings();
  const isDarkMode = themeMode === 'dark';

  return (
    <ReactDiffViewer
      oldValue={oldValue}
      newValue={newValue}
      splitView
      showDiffOnly={false}
      leftTitle={oldTitle}
      rightTitle={newTitle}
      styles={getDiffViewerStyles(isDarkMode)}
      useDarkTheme={isDarkMode}
      extraLinesSurroundingDiff={3}
    />
  );
}
