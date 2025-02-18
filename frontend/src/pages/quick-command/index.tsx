import { Button, Tag } from 'antd';
import * as monaco from 'monaco-editor';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { TaskOutput } from '@/api/services/task';
import HostSelector from '@/components/HostSelector';
import { Iconify } from '@/components/Icon';
import MonacoEditor from '@/components/MonacoEditor';
import { useHostList } from '@/hooks/use-host-list';
import { useTaskWebSocket } from '@/hooks/use-task-websocket';
import { useSettings } from '@/store/setting';

import { useTaskOperations } from '../task-manage/hooks/use-task-manage';

import { OutputPanel } from './components/OutputPanel';
import { StatusDisplay } from './components/StatusDisplay';
import { useQuickCommand } from './hooks/use-quick-command';

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
const MAX_HOST_COUNT = 5;
function QuickCommand() {
  const { t } = useTranslation();
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
    onMessage: useCallback(
      (data: TaskOutput) => {
        if (data.event === 'end' || data.event === 'error') {
          resetStatus();
        }
      },
      [resetStatus],
    ),
    onError: useCallback(() => {
      stopExecution();
    }, [stopExecution]),
  });

  const handleExecute = useCallback(async () => {
    const validationError = validateExecution();
    if (validationError) {
      toast.error(t(validationError));
      return;
    }

    clearMessages();
    resetStatus();

    try {
      const taskId = await execQuickCommand.mutateAsync({
        taskName: t('quick-command.task-name'),
        hostIdList: selectedHosts,
        shortcutScriptContent: content,
      });

      if (!taskId) return;

      setCurrentTaskId(taskId);
      initExecution();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(t('quick-command.execute.error', { error: errorMessage }));
      resetStatus();
    }
  }, [
    validateExecution,
    clearMessages,
    resetStatus,
    content,
    selectedHosts,
    t,
    initExecution,
    execQuickCommand,
    setCurrentTaskId,
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
    <div className="flex h-full">
      {/* Left side - Host Selector */}
      <div className="relative w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 h-full p-4">
          <div className="mb-3 text-sm font-medium">选择主机</div>
          <HostSelector
            defaultValue={selectedHosts}
            onChange={(newSelected) => {
              setSelectedHosts(newSelected);
            }}
            className="max-h-[calc(100vh-120px)] overflow-auto"
          />
        </div>
      </div>

      {/* Right side - Main content */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">已选择：</span>
            <div className="flex min-h-[22px] flex-wrap items-center gap-1.5">
              {selectedHosts.slice(0, MAX_HOST_COUNT).map((hostId) => {
                const host = hostList?.find((h) => h.id === hostId);
                return (
                  <Tag bordered={false} key={hostId}>
                    {host?.name || hostId}
                  </Tag>
                );
              })}
              {selectedHosts.length > MAX_HOST_COUNT &&
                `等 ${selectedHosts.length - MAX_HOST_COUNT} 个主机 `}
              {selectedHosts.length === 0 && (
                <span className="text-sm text-gray-400">未选择任何主机</span>
              )}
            </div>
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
              <Iconify
                icon={
                  navigator.userAgent.includes('Mac')
                    ? 'material-symbols:keyboard-command-key'
                    : 'material-symbols:keyboard-ctrl'
                }
                size={13}
              />
              <span className="opacity-75">+</span>
              <Iconify icon="material-symbols:keyboard-return" size={13} />
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
    </div>
  );
}

export default QuickCommand;
