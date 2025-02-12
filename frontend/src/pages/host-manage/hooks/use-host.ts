import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { create } from 'zustand';

import configService from '@/api/services/config';
import hostService from '@/api/services/host';

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
  const queryClient = useQueryClient();

  const updateHostName = useMutation({
    mutationFn: hostService.updateHostName,
    onSuccess: () => {
      toast.success('更新主机名称成功');
      queryClient.invalidateQueries({ queryKey: ['hostList'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '更新主机名称失败');
    },
  });

  const deleteHosts = useMutation({
    mutationFn: hostService.deleteHosts,
    onSuccess: () => {
      toast.success('删除主机成功');
      queryClient.invalidateQueries({ queryKey: ['hostList'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '删除主机失败');
    },
  });

  return {
    updateHostName,
    deleteHosts,
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

/**
 * 获取新增主机命令
 */
export function useCreateHostCommand(osFamily: string) {
  return useQuery({
    queryKey: ['createHostCommand', osFamily],
    queryFn: () => hostService.getCreateHostCommand(osFamily),
  });
}

export function useServerUrl() {
  return useQuery({
    queryKey: ['system-config', 'ServerUrl'],
    queryFn: () => configService.getConfigValue('system', 'ServerUrl'),
  });
}
