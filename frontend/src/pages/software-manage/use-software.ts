import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { create } from 'zustand';

import softwareService, { RoleItem, TaskInfo } from '@/api/services/software';

// 软件基础信息状态
interface SoftwareState {
  editingId: number | null;
  editingField: string | null;
  selectedLabels: string[];
  editingSoftwareId: number | null;
  actions: {
    startEdit: (id: number, field: string) => void;
    cancelEdit: () => void;
    isEditing: (id: number, field: string) => boolean;
    setSelectedLabels: (labels: string[]) => void;
    setEditingSoftwareId: (id: number | null) => void;
  };
}

export const useSoftwareStore = create<SoftwareState>((set, get) => ({
  editingId: null,
  editingField: null,
  selectedLabels: [],
  editingSoftwareId: null,

  actions: {
    startEdit: (id, field) => set({ editingId: id, editingField: field }),
    cancelEdit: () => set({ editingId: null, editingField: null }),
    isEditing: (id, field) => {
      const { editingId, editingField } = get();
      return editingId === id && editingField === field;
    },
    setSelectedLabels: (labels) => set({ selectedLabels: labels }),
    setEditingSoftwareId: (id) => set({ editingSoftwareId: id }),
  },
}));

// 查询 hooks
export function useRoleList() {
  return useQuery({
    queryKey: ['roleList'],
    queryFn: () => softwareService.getRoleList(),
  });
}

// 获取版本列表
export function useRoleRevisions(id: number) {
  return useQuery({
    queryKey: ['roleRevisions', id],
    queryFn: () => softwareService.getRoleRevisions(id),
  });
}

// 获取草稿版本
export function useDraftRevision(id: number) {
  return useQuery({
    queryKey: ['draftRevision', id],
    queryFn: () => softwareService.getDraftRoleRevision(id),
  });
}

// 获取激活版本
export function useActiveRevision(id: number) {
  return useQuery({
    queryKey: ['activeRevision', id],
    queryFn: () => softwareService.getActiveRoleRevision(id),
  });
}

// 版本对比状态
interface RevisionState {
  selectedFiles: string[];
  currentContent: string;
  compareContent: string;
  isComparing: boolean;
  currentId?: number;
  compareId?: number;
  actions: {
    setSelectedFiles: (files: string[]) => void;
    setCurrentVersion: (id: number, content: string) => void;
    setCompareVersion: (id: number, content: string) => void;
    setIsComparing: (comparing: boolean) => void;
    reset: () => void;
  };
}

export const useRevisionStore = create<RevisionState>()((set) => ({
  selectedFiles: [],
  currentContent: '',
  compareContent: '',
  isComparing: false,
  currentId: undefined,
  compareId: undefined,

  actions: {
    setSelectedFiles: (files) => set({ selectedFiles: files }),
    setCurrentVersion: (id, content) => set({ currentId: id, currentContent: content }),
    setCompareVersion: (id, content) => set({ compareId: id, compareContent: content }),
    setIsComparing: (comparing) => set({ isComparing: comparing }),
    reset: () =>
      set({
        selectedFiles: [],
        currentId: undefined,
        compareId: undefined,
        currentContent: '',
        compareContent: '',
        isComparing: false,
      }),
  },
}));

// 操作 hooks
export function useRoleOperations() {
  const queryClient = useQueryClient();

  const operations = {
    createRole: useMutation({
      mutationFn: (role: Omit<RoleItem, 'id'>) => softwareService.createRole(role),
      onSuccess: () => {
        toast.success('角色创建成功');
        queryClient.invalidateQueries({ queryKey: ['roleList'] });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : '角色创建失败');
      },
    }),

    updateRole: useMutation({
      mutationFn: ({ id, data }: { id: number; data: Partial<RoleItem> }) =>
        softwareService.updateRole(id, data),
      onSuccess: () => {
        toast.success('更新成功');
        queryClient.invalidateQueries({ queryKey: ['roleList'] });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : '更新失败');
      },
    }),

    deleteRole: useMutation({
      mutationFn: (id: number) => softwareService.deleteRole(id),
      onSuccess: () => {
        toast.success('删除成功');
        queryClient.invalidateQueries({ queryKey: ['roleList'] });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : '删除失败');
      },
    }),
  };

  return operations;
}

// 版本操作 hooks
export function useRevisionOperations() {
  const queryClient = useQueryClient();

  const operations = {
    activeRevision: useMutation({
      mutationFn: (id: number) => softwareService.activeRevision(id),
      onSuccess: () => {
        toast.success('激活成功');
        queryClient.invalidateQueries({ queryKey: ['roleRevisions'] });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : '激活失败');
      },
    }),

    releaseRevision: useMutation({
      mutationFn: ({ id, changeLog }: { id: number; changeLog: string }) =>
        softwareService.releaseRoleRevision(id, changeLog),
      onSuccess: () => {
        toast.success('发布成功');
        queryClient.invalidateQueries({ queryKey: ['roleRevisions'] });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : '发布失败');
      },
    }),

    deleteRevision: useMutation({
      mutationFn: (id: number) => softwareService.deleteRoleRevision(id),
      onSuccess: () => {
        toast.success('删除成功');
        queryClient.invalidateQueries({ queryKey: ['roleRevisions'] });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : '删除失败');
      },
    }),

    reviseRole: useMutation({
      mutationFn: (task: TaskInfo) => softwareService.reviseRole(task),
      onSuccess: () => {
        toast.success('修改成功');
        queryClient.invalidateQueries({ queryKey: ['roleRevisions'] });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : '修改失败');
      },
    }),
  };

  return operations;
}

// AI 配置生成
export function useAiConfig() {
  return useMutation({
    mutationFn: (requirement: string) => softwareService.getAiConfig(requirement),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '生成配置失败');
    },
  });
}

// 添加配置编辑状态
interface ConfigEditState {
  code: string;
  fileIds: number[];
  userPrompt: string;
  configExplanation: string;
  generatedConfig: string;
  isDrawerOpen: boolean;
  showAlert: boolean;
  actions: {
    setCode: (code: string) => void;
    setFileIds: (ids: number[]) => void;
    setUserPrompt: (prompt: string) => void;
    setConfigExplanation: (explanation: string) => void;
    setGeneratedConfig: (config: string) => void;
    toggleDrawer: (open?: boolean) => void;
    toggleAlert: (show?: boolean) => void;
    reset: () => void;
  };
}

export const useConfigEditStore = create<ConfigEditState>((set) => ({
  code: '',
  fileIds: [],
  userPrompt: '',
  configExplanation: '',
  generatedConfig: '',
  isDrawerOpen: false,
  showAlert: false,

  actions: {
    setCode: (code) => set({ code }),
    setFileIds: (fileIds) => set({ fileIds }),
    setUserPrompt: (userPrompt) => set({ userPrompt }),
    setConfigExplanation: (configExplanation) => set({ configExplanation }),
    setGeneratedConfig: (generatedConfig) => set({ generatedConfig }),
    toggleDrawer: (open) => set((state) => ({ isDrawerOpen: open ?? !state.isDrawerOpen })),
    toggleAlert: (show) => set((state) => ({ showAlert: show ?? !state.showAlert })),
    reset: () =>
      set({
        code: '',
        fileIds: [],
        userPrompt: '',
        configExplanation: '',
        generatedConfig: '',
        isDrawerOpen: false,
        showAlert: false,
      }),
  },
}));
