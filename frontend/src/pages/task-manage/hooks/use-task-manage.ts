import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Form } from 'antd';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import taskService, { RoleVarsConfig } from '@/api/services/task';
import { useRoleList } from '@/pages/software-manage/use-software';
import batchProcessTasks from '@/utils/batch-process-tasks';

import type { TablePaginationConfig } from 'antd/es/table';

/** 获取任务列表的 Hook */
export const useTaskList = (limit = 10, page = 1) => {
  return useQuery({
    queryKey: ['taskList', limit, page],
    queryFn: () => taskService.getTaskList(limit, page),
  });
};

/** 任务操作相关的 Hook */
export const useTaskOperations = () => {
  const queryClient = useQueryClient();

  /** 创建 Playbook 类型任务 */
  const createTask = useMutation({
    mutationFn: taskService.createPlaybookTask,
    onSuccess: () => {
      toast.success('任务创建成功');
      queryClient.invalidateQueries({ queryKey: ['taskList'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '任务创建失败');
    },
  });

  /** 删除任务 */
  const deleteTask = useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: () => {
      toast.success('任务删除成功');
      queryClient.invalidateQueries({ queryKey: ['taskList'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '删除任务失败');
    },
  });

  /** 执行快捷命令 */
  const execQuickCommand = useMutation({
    mutationFn: taskService.createAdHocTask,
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '执行失败');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskList'] });
    },
  });

  /** 批量删除任务 */
  const batchDeleteTasks = async (taskIds: number[]) => {
    return batchProcessTasks(taskIds, async (id) => {
      await taskService.deleteTask(id);
    });
  };

  return {
    createTask,
    deleteTask,
    execQuickCommand,
    batchDeleteTasks,
  };
};

export function useTaskManage() {
  const { data: roleList } = useRoleList();
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: roleList?.count || 0,
    showSizeChanger: true,
    showTotal: (total: number) => `总共 ${total} 项`,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [generatedTaskName, setGeneratedTaskName] = useState('');
  const [roleVars, setRoleVars] = useState<RoleVarsConfig[]>([]);

  const {
    data: taskList,
    isLoading,
    refetch,
  } = useTaskList(pagination.pageSize, pagination.current);

  useEffect(() => {
    if (taskList?.count !== undefined) {
      setPagination((prev) => ({
        ...prev,
        total: taskList.count,
      }));
    }
  }, [taskList?.count]);

  const { modal, message } = App.useApp();
  const { createTask, deleteTask, batchDeleteTasks } = useTaskOperations();
  // 处理角色变量变化
  const handleRoleVarsChange = (vars: RoleVarsConfig[]) => {
    setRoleVars(vars);
    form.setFieldsValue({ vars });
  };

  // 重置表单
  const resetForm = () => {
    form.resetFields();
    setGeneratedTaskName('');
    setRoleVars([]);
  };

  // 处理分页变化
  const handlePaginationChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
      total: pagination.total,
      showSizeChanger: true,
      showTotal: (total: number) => `总共 ${total} 项`,
    });
    refetch();
  };

  // 处理批量删除
  const handleBatchDelete = () => {
    modal.confirm({
      title: '确认批量删除',
      content: '您确定要删除选中的任务吗？此操作不可逆。',
      onOk: async () => {
        const { success, failed } = await batchDeleteTasks(selectedRowKeys);
        setSelectedRowKeys([]);

        if (success.length > 0) {
          message.success(`成功删除了 ${success.length} 个任务。`);
        }

        if (failed.length > 0) {
          message.error(`删除失败的任务 ID: ${failed.join(', ')}`);
        }
        refetch();
      },
    });
  };

  // 处理删除单个任务
  const handleDeleteTask = (taskId: number) => {
    deleteTask.mutate(taskId);
  };

  return {
    form,
    pagination,
    selectedRowKeys,
    taskList: taskList?.list || [],
    isLoading,
    roleList,
    generatedTaskName,
    roleVars,
    setSelectedRowKeys,
    handleBatchDelete,
    handlePaginationChange,
    handleDeleteTask,
    handleRoleVarsChange,
    resetForm,
    createTask,
    refetch,
  };
}
