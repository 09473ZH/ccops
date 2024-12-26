import { create } from 'zustand';

import { TaskOutput } from '@/api/services/taskService';
import { CommandEvent } from '@/pages/quick-command/components/status-display';

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
  resetStatus: () => void;
  updateDuration: () => void;
  handleTaskMessage: (data: TaskOutput) => void;
  validateExecution: () => string | null;
}

export const useQuickCommand = create<QuickCommandState>((set, get) => ({
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
    set(() => ({
      status: {
        event: 'running',
        startTime: Date.now(),
        endTime: null,
        duration: 0,
      },
    }));
  },

  resetStatus: () => {
    set((state) => {
      const now = Date.now();
      return {
        status: {
          event: 'end',
          startTime: state.status.startTime,
          endTime: now,
          duration: state.status.startTime
            ? Number(((now - state.status.startTime) / 1000).toFixed(2))
            : 0,
        },
        currentTaskId: null,
      };
    });
  },

  updateDuration: () => {
    set((state) => {
      if (state.status.event === 'running' && state.status.startTime) {
        const now = Date.now();
        return {
          status: {
            ...state.status,
            duration: Number(((now - state.status.startTime) / 1000).toFixed(2)),
          },
        };
      }
      return state;
    });
  },

  handleTaskMessage: (data) => {
    set((state) => {
      if (data.event === 'end' || data.event === 'error') {
        const now = Date.now();
        return {
          status: {
            event: 'end',
            startTime: state.status.startTime,
            endTime: now,
            duration: state.status.startTime
              ? Number(((now - state.status.startTime) / 1000).toFixed(2))
              : state.status.duration,
          },
          currentTaskId: null,
        };
      }
      return state;
    });
  },
}));
