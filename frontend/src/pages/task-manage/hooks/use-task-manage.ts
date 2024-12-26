import { useQuery } from '@tanstack/react-query';
import { App, Form } from 'antd';
import { useState, useEffect } from 'react';

import taskService, { RoleVarsConfig } from '@/api/services/taskService';
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage';
import { useRoleList } from '@/pages/software-manage/use-software';
import batchProcessTasks from '@/utils/batchProcessTasks';

import type { TablePaginationConfig } from 'antd/es/table';

// TODO: 优化得到更多的 hooks...
/** 获取任务列表的 Hook */
export const useTaskList = (limit = 10, page = 1) => {
  return useQuery({
    queryKey: ['taskList', limit, page],
    queryFn: () => taskService.getTaskList(limit, page),
  });
};

/** 任务操作相关的 Hook */
export const useTaskOperations = () => {
  /** 创建 Playbook 类型任务 */
  const createTask = useMutationWithMessage({
    mutationFn: taskService.createPlaybookTask,
    successMsg: '任务创建成功',
    errMsg: '任务创建失败',
    invalidateKeys: ['taskList'],
  });

  /** 删除任务 */
  const deleteTask = useMutationWithMessage({
    mutationFn: taskService.deleteTask,
    successMsg: '任务删除成功',
    errMsg: '删除任务失败',
    invalidateKeys: ['taskList'],
  });

  /** 执行快捷命令 */
  const execQuickCommand = useMutationWithMessage({
    mutationFn: taskService.createAdHocTask,
    errMsg: '执行失败',
    invalidateKeys: ['taskList'],
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
  const { list: roleList, count: roleTotal } = useRoleList();
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: roleTotal,
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
    deleteTask(taskId);
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
