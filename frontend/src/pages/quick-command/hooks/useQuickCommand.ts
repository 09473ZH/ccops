import { create } from 'zustand';

import { TaskOutput } from '@/api/services/taskService';
import { CommandEvent } from '@/pages/quick-command/components/status-display';

const DURATION_PRECISION = 2;

interface QuickCommandState {
  content: string;
  selectedHosts: number[];
  autoScroll: boolean;
  currentTaskId: number | null;
  status: {
    event: CommandEvent | null;
    startTime: number | null;
    endTime: number | null;
    duration: number;
  };
  // Actions
  setContent: (content: string) => void;
  setSelectedHosts: (hosts: number[]) => void;
  setAutoScroll: (autoScroll: boolean) => void;
  setCurrentTaskId: (taskId: number | null) => void;
  startExecution: () => void;
  stopExecution: () => void;
  resetStatus: () => void;
  updateDuration: () => void;
  handleTaskMessage: (data: TaskOutput) => void;
  validateExecution: () => string | null;
}

const calculateDuration = (startTime: number | null, endTime: number): number => {
  if (!startTime) return 0;
  return Number(((endTime - startTime) / 1000).toFixed(DURATION_PRECISION));
};

export const useQuickCommand = create<QuickCommandState>((set, get) => {
  const getResetStatus = (state: QuickCommandState) => {
    const now = Date.now();
    return {
      ...state,
      status: {
        event: null,
        startTime: state.status.startTime,
        endTime: now,
        duration: calculateDuration(state.status.startTime, now),
      },
      currentTaskId: null,
    };
  };

  return {
    content: '',
    selectedHosts: [],
    autoScroll: true,
    currentTaskId: null,
    status: {
      event: null,
      startTime: null,
      endTime: null,
      duration: 0,
    },

    setContent: (content) => set({ content }),
    setSelectedHosts: (hosts) => {
      if (Array.isArray(hosts)) {
        set({ selectedHosts: hosts });
      }
    },
    setAutoScroll: (autoScroll) => set({ autoScroll }),
    setCurrentTaskId: (taskId) => set({ currentTaskId: taskId }),

    validateExecution: () => {
      const state = get();
      if (!state.content?.trim()) {
        return 'common.inputText';
      }

      if (!Array.isArray(state.selectedHosts) || state.selectedHosts.length === 0) {
        return 'quick-command.select.error';
      }

      return null;
    },

    startExecution: () => {
      set((state) => ({
        ...state,
        status: {
          event: 'running',
          startTime: Date.now(),
          endTime: null,
          duration: 0,
        },
      }));
    },

    stopExecution: () => {
      set(getResetStatus);
    },

    resetStatus: () => {
      set(getResetStatus);
    },

    updateDuration: () => {
      set((state) => {
        if (state.status.event === 'running' && state.status.startTime) {
          const now = Date.now();
          return {
            ...state,
            status: {
              ...state.status,
              duration: calculateDuration(state.status.startTime, now),
            },
          };
        }
        return state;
      });
    },

    handleTaskMessage: (data: TaskOutput) => {
      set((state) => {
        // 如果taskId不匹配，不处理
        if (data.taskId && data.taskId !== state.currentTaskId) {
          return state;
        }

        // 如果收到结束或错误事件，保留时间信息和用户选择，但重置执行状态
        if (data.event === 'end' || data.event === 'error') {
          return getResetStatus(state);
        }

        // 如果收到运行事件且当前不在运行状态，更新为运行状态
        if (data.event === 'running' && state.status.event !== 'running') {
          return {
            ...state,
            status: {
              event: 'running',
              startTime: Date.now(),
              endTime: null,
              duration: 0,
            },
            currentTaskId: data.taskId || state.currentTaskId,
          };
        }

        return state;
      });
    },
  };
});
