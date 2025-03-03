import { Modal } from 'antd';
import { useMemo, useEffect } from 'react';

import { useTaskWebSocket } from '@/hooks/use-task-websocket';

import { useTaskList } from '../hooks/use-task-manage';

interface TaskOutputModalProps {
  open: boolean;
  taskId: number;
  isDarkMode: boolean;
  isRealtime?: boolean; // 是否需要实时输出
  onClose: () => void;
}

export function TaskOutputModal({
  open,
  taskId,
  isDarkMode,
  isRealtime = false,
  onClose,
}: TaskOutputModalProps) {
  const { data: taskList, refetch } = useTaskList(10, 1);

  const { messages } = useTaskWebSocket({
    taskId: isRealtime ? taskId : null,
    autoClear: true,
  });

  useEffect(() => {
    if (open && !isRealtime) {
      refetch();
    }
  }, [open, isRealtime, refetch]);

  const displayOutput = useMemo(() => {
    if (isRealtime) {
      if (Array.isArray(messages)) {
        return messages.join('\n');
      }
      return messages;
    }
    return taskList?.list?.find((task) => task.id === taskId)?.result;
  }, [isRealtime, messages, taskList?.list, taskId]);

  const renderContent = useMemo(() => {
    return <pre className="m-0 whitespace-pre-wrap">{displayOutput || '暂无输出'}</pre>;
  }, [displayOutput]);

  return (
    <Modal
      title={`任务输出 (ID: ${taskId})`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div
        className={`p-4 font-mono text-sm ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}
      >
        {renderContent}
      </div>
    </Modal>
  );
}
