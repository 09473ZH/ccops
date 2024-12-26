import { Typography, Table, Space, Button, Popconfirm, Dropdown, Input } from 'antd';
import { Suspense, useMemo } from 'react';

import type { HostInfo } from '@/api/services/hostService';
import { Iconify } from '@/components/icon';
import { useHostList } from '@/hooks/useHostList';
import { useModalsControl } from '@/hooks/useModalsControl';
import { useTable } from '@/hooks/useTable';

import { ModalName, Modals } from './components/modals';
import { ColumnSelector } from './components/table/column-selector';
import { getColumns, getColumnGroups } from './components/table/columns';
import { HOST_TABLE_CONFIG } from './config/columns';
import { useHostActions, useHostState } from './hooks';

const createMenuItems = (
  selectedRowsCount: number,
  onDelete: (ids: number[]) => void,
  onOpenSshConfig: () => void,
) => [
  {
    key: 'sshConfig',
    label: 'SSH 配置',
    icon: <Iconify icon="flowbite:terminal-outline" />,
    onClick: onOpenSshConfig,
  },
  {
    key: 'batchDelete',
    icon: <Iconify icon="flowbite:trash-bin-outline" />,
    label: (
      <Popconfirm
        title="确认删除"
        description={`确定要删除选中的 ${selectedRowsCount} 个主机吗？`}
        onConfirm={() => onDelete([selectedRowsCount])}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <span className="text-red-500">批量删除</span>
      </Popconfirm>
    ),
    danger: true,
  },
];

function HostManage() {
  const { open, isOpen, close } = useModalsControl({
    modals: [ModalName.Create, ModalName.AssignLabel, ModalName.LabelManage, ModalName.SshConfig],
  });
  const { list: hostList, isLoading } = useHostList();
  const {
    table,
    filteredData,
    paginatedData,
    handleSearch,
    handlePaginationChange,
    setTableState,
  } = useTable({
    defaultPageSize: 20,
    data: hostList,
    searchFields: HOST_TABLE_CONFIG.SEARCH_FIELDS,
    defaultVisibleColumns: HOST_TABLE_CONFIG.ALL_COLUMNS,
  });

  const actions = useHostActions();
  const { editing, setEditing, resetEditing, setLabelAssign, resetLabelAssign } = useHostState();

  const columnGroups = getColumnGroups();
  const hasSelected = table.selectedRows.length > 0;

  const menu = useMemo(
    () => ({
      items: createMenuItems(table.selectedRows.length, actions.deleteHosts, () =>
        open(ModalName.SshConfig),
      ),
    }),
    [actions.deleteHosts, table.selectedRows, open],
  );

  const handleEditName = (record: HostInfo) => {
    setEditing({
      id: record.id,
      name: record.name,
      hostServerUrl: record.hostServerUrl,
      action: 'edit',
    });
  };

  const handleSaveName = async () => {
    if (!editing.id || !editing.hostServerUrl) return;
    await actions.updateHostName({
      hostname: editing.name,
      hostServerUrl: editing.hostServerUrl,
    });
    resetEditing();
  };

  const handleAssignLabels = (record: HostInfo) => {
    setLabelAssign({
      hostId: record.id,
      selectedLabels: record.label?.map((l) => l.id) || [],
    });
    open(ModalName.AssignLabel);
  };

  const columns = getColumns(
    editing,
    handleEditName,
    handleSaveName,
    handleAssignLabels,
    actions.deleteHosts,
    setEditing,
  );

  return (
    <>
      <Typography.Title className="mt-4" level={2}>
        主机管理
      </Typography.Title>

      {/* 工具栏 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative w-64">
            <Input
              placeholder="搜索主机名称/操作系统"
              allowClear
              prefix={<Iconify icon="solar:magnifer-linear" className="text-gray-400" />}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <ColumnSelector
            visibleColumns={table.visibleColumns}
            setTableState={setTableState}
            columns={columns}
            columnGroups={columnGroups}
          />
        </div>
        <Space size="middle">
          <Button
            icon={<Iconify icon="flowbite:label-outline" />}
            onClick={() => open(ModalName.LabelManage)}
            className="flex items-center space-x-1"
          >
            <span>标签管理</span>
          </Button>
          <Dropdown menu={menu} disabled={!hasSelected}>
            <Button
              className="flex items-center space-x-1"
              icon={<Iconify icon="flowbite:dots-vertical-outline" />}
              disabled={!hasSelected}
            >
              <span>批量操作</span>
            </Button>
          </Dropdown>
          <Button
            type="primary"
            className="flex items-center space-x-1"
            icon={<Iconify icon="flowbite:plus-outline" />}
            onClick={() => open(ModalName.Create)}
          >
            <span>添加主机</span>
          </Button>
        </Space>
      </div>

      {/* 主机列表表格 */}
      <Table
        scroll={{ x: 'max-content' }}
        columns={columns.filter((col) => table.visibleColumns.includes(col.key as string))}
        dataSource={paginatedData}
        loading={isLoading}
        rowSelection={{
          selectedRowKeys: table.selectedRows,
          onChange: (keys) => setTableState({ selectedRows: keys }),
        }}
        rowKey="id"
        pagination={{
          ...table,
          total: filteredData.length,
          onChange: handlePaginationChange,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      {/* 模态框组件 */}
      <Suspense fallback={null}>
        <Modals.Create open={isOpen(ModalName.Create)} onClose={() => close(ModalName.Create)} />
        <Modals.AssignLabel
          open={isOpen(ModalName.AssignLabel)}
          onClose={() => {
            close(ModalName.AssignLabel);
            resetLabelAssign();
          }}
        />
        <Modals.LabelManage
          open={isOpen(ModalName.LabelManage)}
          onClose={() => close(ModalName.LabelManage)}
        />
        <Modals.SshConfig
          open={isOpen(ModalName.SshConfig)}
          onClose={() => close(ModalName.SshConfig)}
          hostList={hostList}
          selectedRows={table.selectedRows}
        />
      </Suspense>
    </>
  );
}

export default HostManage;
