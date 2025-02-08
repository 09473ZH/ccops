import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';

import softwareService, { RoleItem, RevisionItem, TaskInfo } from '@/api/services/software';
import useMutationWithMessage from '@/hooks/use-mutation-with-message';

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

// 版本对比状态
interface CompareState {
  currentId?: number;
  compareId?: number;
  currentContent: string;
  compareContent: string;
  isComparing: boolean;
  actions: {
    setCurrentVersion: (id: number, content: string) => void;
    setCompareVersion: (id: number, content: string) => void;
    setIsComparing: (comparing: boolean) => void;
    reset: () => void;
  };
}

export const useCompareStore = create<CompareState>((set) => ({
  currentContent: '',
  compareContent: '',
  isComparing: false,

  actions: {
    setCurrentVersion: (id, content) => set({ currentId: id, currentContent: content }),
    setCompareVersion: (id, content) => set({ compareId: id, compareContent: content }),
    setIsComparing: (comparing) => set({ isComparing: comparing }),
    reset: () =>
      set({
        currentId: undefined,
        compareId: undefined,
        currentContent: '',
        compareContent: '',
        isComparing: false,
      }),
  },
}));

// 查询 hooks
export function useRoleList() {
  const { data, isLoading } = useQuery({
    queryKey: ['roleList'],
    queryFn: () => softwareService.getRoleList(),
  });

  return {
    list: data?.list || [],
    count: data?.count || 0,
    isLoading,
  };
}

export const useRoleRevisions = (id: number) => {
  return useQuery({
    queryKey: ['roleRevisions', id],
    queryFn: () => softwareService.getRoleRevisions(id),
    select: (data: { list: RevisionItem[] }) =>
      data.list
        .filter((revision) => revision.isRelease !== false)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  });
};

export const useDraftRoleRevision = (id: number) => {
  return useQuery<RevisionItem>({
    queryKey: ['draftRoleRevision', id],
    queryFn: () => softwareService.getDraftRoleRevision(id),
  });
};

export const useActiveRoleRevision = (id: number) => {
  return useQuery<RevisionItem>({
    queryKey: ['activeRoleRevision', id],
    queryFn: () => softwareService.getActiveRoleRevision(id),
  });
};

// 操作 hooks
export const useRoleOperations = () => {
  const createRole = useMutationWithMessage({
    mutationFn: (role: Omit<RoleItem, 'id'>) => softwareService.createRole(role),
    successMsg: '角色创建成功',
    errMsg: '角色创建失败',
    invalidateKeys: ['roleList'],
  });

  const updateRole = useMutationWithMessage({
    mutationFn: ({ id, data }: { id: number; data: Partial<RoleItem> }) =>
      softwareService.updateRole(id, data),
    successMsg: '更新成功',
    errMsg: '更新失败',
    invalidateKeys: ['roleList'],
  });

  const deleteRole = useMutationWithMessage({
    mutationFn: (id: number) => softwareService.deleteRole(id),
    successMsg: '删除成功',
    errMsg: '删除失败',
    invalidateKeys: ['roleList'],
  });

  return {
    createRole,
    updateRole,
    deleteRole,
  };
};

export const useRevisionOperations = () => {
  const activeRevision = useMutationWithMessage({
    mutationFn: (id: number) => softwareService.activeRevision(id),
    successMsg: '激活成功',
    errMsg: '激活失败',
    invalidateKeys: ['roleRevisions'],
  });

  const releaseRevision = useMutationWithMessage({
    mutationFn: ({ id, changeLog }: { id: number; changeLog: string }) =>
      softwareService.releaseRoleRevision(id, changeLog),
    successMsg: '发布成功',
    errMsg: '发布失败',
    invalidateKeys: ['roleRevisions'],
  });

  const deleteRevision = useMutationWithMessage({
    mutationFn: (id: number) => softwareService.deleteRoleRevision(id),
    successMsg: '删除成功',
    errMsg: '删除失败',
    invalidateKeys: ['roleRevisions'],
  });

  const reviseRole = useMutationWithMessage({
    mutationFn: (task: TaskInfo) => softwareService.reviseRole(task),
    successMsg: '修改成功',
    errMsg: '修改失败',
    invalidateKeys: ['roleRevisions'],
  });

  return {
    activeRevision,
    releaseRevision,
    deleteRevision,
    reviseRole,
  };
};

interface AiConfigResponse {
  description: string;
  task_content: string;
}

export const useAiConfig = () => {
  return useMutationWithMessage<AiConfigResponse, string>({
    mutationFn: (requirement) => softwareService.getAiConfig(requirement),
    errMsg: '生成配置失败',
  });
};

// 版本列表状态
interface RevisionState {
  selectedFiles: string[];
  currentId?: number;
  compareVersionId?: number;
  currentContent: string;
  newContent: string;
  isComparing: boolean;
  actions: {
    setSelectedFiles: (files: string[]) => void;
    setCurrentVersion: (id: number, content: string) => void;
    setCompareVersion: (id: number, content: string) => void;
    setIsComparing: (comparing: boolean) => void;
    reset: () => void;
  };
}

export const useRevisionStore = create<RevisionState>((set) => ({
  selectedFiles: [],
  currentContent: '',
  newContent: '',
  isComparing: false,

  actions: {
    setSelectedFiles: (files) => set({ selectedFiles: files }),
    setCurrentVersion: (id, content) => set({ currentId: id, currentContent: content }),
    setCompareVersion: (id, content) => set({ compareVersionId: id, newContent: content }),
    setIsComparing: (comparing) => set({ isComparing: comparing }),
    reset: () =>
      set({
        selectedFiles: [],
        currentId: undefined,
        compareVersionId: undefined,
        currentContent: '',
        newContent: '',
        isComparing: false,
      }),
  },
}));

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
