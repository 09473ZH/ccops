import { Button, Space, Form } from 'antd';
import { useState } from 'react';

import { TaskInfo } from '@/api/services/task';
import type { PlaybookTaskReq } from '@/api/services/task';
import { Iconify } from '@/components/Icon';
import { useModalsControl } from '@/hooks/use-modals-control';
import { useSettings } from '@/store/setting';

import { CreateTaskModal } from './components/CreateTaskModal';
import { TaskOutputModal } from './components/TaskOutputModal';
import { TaskTable } from './components/TaskTable';
import { useTaskManage } from './hooks/use-task-manage';

function TaskManagePage() {
  const [form] = Form.useForm();
  const {
    pagination,
    selectedRowKeys,
    taskList,
    isLoading,
    setSelectedRowKeys,
    handleBatchDelete,
    handlePaginationChange,
    handleDeleteTask,
    createTask,
  } = useTaskManage();
  const { themeMode } = useSettings();
  const isDarkMode = themeMode === 'dark';
  const { open, isOpen, close } = useModalsControl({
    modals: ['createTask', 'taskOutput'],
  });

  const [isRestarting, setIsRestarting] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [isRealTime, setIsRealTime] = useState(false);
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: number[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const handleOpenCreateModal = () => {
    setIsRestarting(false);
    open('createTask');
  };

  const handleRestart = async (record: TaskInfo) => {
    if (!form) return;

    form.setFieldsValue({
      roleIdList: record.roleDetails.roleIdList,
      hostIdList: record.hosts.map((host) => host.hostId),
      taskName: record.taskName,
    });

    if (record.roleDetails.roleVarContent) {
      const varsMap: Record<number, any[]> = {};

      record.roleDetails.roleVarContent.forEach((roleVar) => {
        if (roleVar.roleId && roleVar.content) {
          varsMap[roleVar.roleId] = Array.isArray(roleVar.content)
            ? roleVar.content.map((item) => ({
                key: item.key,
                value: item.value,
              }))
            : [];
        }
      });
      form.setFieldValue('vars', varsMap);
    }

    setIsRestarting(true);
    open('createTask');
  };

  const handleViewOutput = (taskId: number) => {
    setCurrentTaskId(taskId);
    setIsRealTime(false);
    open('taskOutput');
  };

  const handleCloseOutput = () => {
    setCurrentTaskId(null);
    close('taskOutput');
  };

  const handleCloseCreateModal = () => {
    form.resetFields();
    setIsRestarting(false);
    close('createTask');
  };
  const handleCreateSuccess = async (taskId: number) => {
    setIsRealTime(true);
    handleCloseCreateModal();
    setCurrentTaskId(taskId);
    open('taskOutput');
  };

  const handleSubmit = async (values: PlaybookTaskReq) => {
    const taskId = await createTask.mutateAsync({
      ...values,
    });

    if (!taskId) return;
    handleCreateSuccess(taskId);
  };

  return (
    <div className="flex h-full flex-col p-5">
      <div className="mb-4 flex justify-end">
        <Space>
          <Button
            danger
            disabled={!selectedRowKeys.length}
            icon={<Iconify icon="flowbite:trash-bin-outline" />}
            onClick={handleBatchDelete}
          >
            批量删除
          </Button>
          <Button
            type="primary"
            icon={<Iconify icon="flowbite:plus-outline" />}
            onClick={handleOpenCreateModal}
          >
            新建任务
          </Button>
        </Space>
      </div>
      <TaskTable
        loading={isLoading}
        dataSource={taskList}
        pagination={pagination}
        rowSelection={rowSelection}
        onTableChange={handlePaginationChange}
        onViewOutput={handleViewOutput}
        onRestart={handleRestart}
        onDelete={handleDeleteTask}
      />

      <CreateTaskModal
        open={isOpen('createTask')}
        isRestarting={isRestarting}
        onClose={handleCloseCreateModal}
        onSubmit={handleSubmit}
        form={form}
      />

      <TaskOutputModal
        open={isOpen('taskOutput')}
        taskId={currentTaskId || 0}
        isDarkMode={isDarkMode}
        isRealtime={isRealTime}
        onClose={handleCloseOutput}
      />
    </div>
  );
}

export default TaskManagePage;
