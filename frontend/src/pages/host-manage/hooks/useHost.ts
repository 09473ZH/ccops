import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';

import hostService from '@/api/services/hostService';
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage';

// Types
export interface EditingState {
  id: number | null;
  name: string;
  hostServerUrl: string;
  action: 'edit' | null;
}

interface LabelAssignState {
  hostId: number | null;
  selectedLabels: number[];
}

interface HostState {
  editing: EditingState;
  labelAssign: LabelAssignState;
}

interface HostStore extends HostState {
  setEditing: (editing: Partial<EditingState>) => void;
  resetEditing: () => void;
  setLabelAssign: (labelAssign: Partial<LabelAssignState>) => void;
  resetLabelAssign: () => void;
}

const initialState: HostState = {
  editing: {
    id: null,
    name: '',
    hostServerUrl: '',
    action: null,
  },
  labelAssign: {
    hostId: null,
    selectedLabels: [],
  },
};

/**
 * 主机状态管理 Hook
 */
export const useHostState = create<HostStore>((set) => ({
  editing: initialState.editing,
  labelAssign: initialState.labelAssign,

  setEditing: (editing) =>
    set((state) => ({
      editing: { ...state.editing, ...editing },
    })),

  resetEditing: () => set({ editing: initialState.editing }),

  setLabelAssign: (labelAssign) =>
    set((state) => ({
      labelAssign: { ...state.labelAssign, ...labelAssign },
    })),

  resetLabelAssign: () => set({ labelAssign: initialState.labelAssign }),
}));
/**
 * 主机操作相关的 Hook
 */
export function useHostActions() {
  return {
    updateHostName: useMutationWithMessage({
      mutationFn: hostService.updateHostName,
      successMsg: '更新主机名称成功',
      errMsg: '更新主机名称失败',
      invalidateKeys: ['hostList'],
    }),

    deleteHosts: useMutationWithMessage({
      mutationFn: hostService.deleteHosts,
      successMsg: '删除主机成功',
      errMsg: '删除主机失败',
      invalidateKeys: ['hostList'],
    }),
  };
}

/**
 * 获取主机详情的 Hook
 */
export function useHostDetail(hostId: number) {
  return useQuery({
    queryKey: ['host', hostId],
    queryFn: () => hostService.getHostDetail(hostId),
  });
}
