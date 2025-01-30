import { Button, Typography, App } from 'antd';
import * as monaco from 'monaco-editor';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { HostSelector } from '@/components/host/host-selector';
import IconifyIcon from '@/components/icon/iconify-icon';
import MonacoEditor from '@/components/monaco-editor';
import { useHostList } from '@/hooks/useHostList';
import { useTaskWebSocket } from '@/hooks/useTaskWebSocket';
import { useSettings } from '@/store/settingStore';

import { useTaskOperations } from '../task-manage/hooks/use-task-manage';

import { OutputPanel } from './components/output-panel';
import { StatusDisplay } from './components/status-display';
import { useQuickCommand } from './hooks/useQuickCommand';

const EDITOR_KEYBINDINGS = [
  {
    keyCode: monaco.KeyCode.Enter,
    keyMod: monaco.KeyMod.CtrlCmd,
    handler: () => {
      window.dispatchEvent(new CustomEvent('monaco-execute-command'));
      return true;
    },
  },
];

function QuickCommand() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { themeMode } = useSettings();
  const { execQuickCommand } = useTaskOperations();
  const { list: hostList } = useHostList();
  const isDarkMode = themeMode === 'dark';

  const {
    content,
    selectedHosts,
    autoScroll,
    status: commandStatus,
    currentTaskId,
    setContent,
    setSelectedHosts,
    setAutoScroll,
    setCurrentTaskId,
    startExecution: initExecution,
    stopExecution,
    resetStatus,
    updateDuration,
    validateExecution,
  } = useQuickCommand();

  const { messages, clearMessages, error } = useTaskWebSocket({
    taskId: currentTaskId,
    autoClear: false,
    onMessage: (data) => {
      if (data.event === 'end' || data.event === 'error') {
        resetStatus();
      }
    },
    onError: () => {
      stopExecution();
    },
  });

  const handleExecute = useCallback(async () => {
    const error = validateExecution();
    if (error) {
      message.error(t(error));
      return;
    }

    try {
      resetStatus();
      clearMessages();

      const taskId = await execQuickCommand({
        taskName: '快捷命令',
        hostIdList: selectedHosts,
        shortcutScriptContent: content,
      });

      if (!taskId) {
        throw new Error('No task ID returned');
      }

      setCurrentTaskId(taskId);
      initExecution();
    } catch (error) {
      message.error(`${t('quick-command.execute.error')}: ${(error as Error).message}`);
      resetStatus();
    }
  }, [
    validateExecution,
    content,
    selectedHosts,
    message,
    t,
    initExecution,
    execQuickCommand,
    resetStatus,
    setCurrentTaskId,
    clearMessages,
  ]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (commandStatus.event === 'running' && commandStatus.startTime) {
      timer = setInterval(updateDuration, 100);
    }
    return () => timer && clearInterval(timer);
  }, [commandStatus.event, commandStatus.startTime, updateDuration]);

  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      const outputElement = document.getElementById('output-container');
      if (outputElement) {
        outputElement.scrollTo({ top: outputElement.scrollHeight });
      }
    }
  }, [autoScroll, messages.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const { activeElement } = document;
        const editorElement = document.querySelector('.monaco-editor');
        if (editorElement?.contains(activeElement)) {
          return;
        }
        handleExecute();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleExecute]);

  useEffect(() => {
    const handleEditorExecute = () => handleExecute();
    window.addEventListener('monaco-execute-command', handleEditorExecute);
    return () => window.removeEventListener('monaco-execute-command', handleEditorExecute);
  }, [handleExecute]);

  return (
    <div className="flex h-full flex-col gap-4">
      <Typography.Title className="mt-4" level={2}>
        {t('quick-command.title')}
      </Typography.Title>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Typography.Text strong className="whitespace-nowrap">
            {t('quick-command.select-host.title')}
          </Typography.Text>
          <HostSelector
            hostList={hostList}
            className="w-[600px]"
            value={selectedHosts}
            onChange={(selectedHosts: number[]) => setSelectedHosts(selectedHosts)}
          />
        </div>
        <StatusDisplay event={commandStatus.event} duration={commandStatus.duration} />
      </div>

      <div className="h-[300px]">
        <MonacoEditor
          height="100%"
          language="yaml"
          value={content}
          onChange={(value) => setContent(value || '')}
          className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700"
          keybindings={EDITOR_KEYBINDINGS}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="primary"
          loading={commandStatus.event === 'running'}
          className="flex h-7 items-center rounded-md px-3"
          onClick={handleExecute}
        >
          <div className="flex items-center gap-1.5 text-sm">
            <IconifyIcon
              icon={
                navigator.userAgent.includes('Mac')
                  ? 'material-symbols:keyboard-command-key'
                  : 'material-symbols:keyboard-ctrl'
              }
              size={13}
            />
            <span className="opacity-75">+</span>
            <IconifyIcon icon="material-symbols:keyboard-return" size={13} />
            <span>{t('quick-command.execute.title')}</span>
          </div>
        </Button>
      </div>

      <OutputPanel
        output={messages}
        autoScroll={autoScroll}
        onAutoScrollChange={setAutoScroll}
        onClear={clearMessages}
        isDarkMode={isDarkMode}
        error={error}
      />
    </div>
  );
}

export default QuickCommand;
