import { Table, Button, Input, Modal } from 'antd';
import { Suspense } from 'react';

import type { HostInfo } from '@/api/services/host';
import { Iconify } from '@/components/Icon';
import { useHostList } from '@/hooks/use-host-list';
import { useModalsControl } from '@/hooks/use-modals-control';
import { useTable } from '@/hooks/use-table';

import { ModalName, Modals } from './components/Modals';
import { ColumnSelector } from './components/Table/ColumnSelector';
import { getColumns, getColumnGroups } from './components/Table/get-columns';
import { HOST_TABLE_CONFIG } from './constants/columns';
import { useHostActions } from './hooks/state/use-host';
import { useHostStore } from './hooks/state/use-host-store';

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
  const { editing, setEditing, resetEditing, setLabelAssign, resetLabelAssign } = useHostStore();

  const columnGroups = getColumnGroups();

  const handleEditName = (record: HostInfo) => {
    setEditing({
      id: record.id,
      name: record.name,
      hostServerUrl: record.hostServerUrl,
      action: 'edit',
    });
  };

  const handleSaveName = () => {
    if (!editing.id || !editing.hostServerUrl) return;
    actions.updateHostName.mutate({
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

  const batchActions = [
    <Button
      key="ssh"
      type="text"
      size="small"
      className="flex items-center hover:bg-white/10"
      icon={<Iconify icon="flowbite:code-outline" />}
      onClick={() => open(ModalName.SshConfig)}
    >
      SSH 配置
    </Button>,
    <Button
      key="delete"
      type="text"
      danger
      size="small"
      className="flex items-center hover:bg-white/10"
      icon={<Iconify icon="flowbite:trash-bin-outline" />}
      onClick={() => {
        Modal.confirm({
          title: '确认删除',
          content: `确定要删除选中的 ${table.selectedRows.length} 个主机吗？`,
          okText: '确认',
          cancelText: '取消',
          okButtonProps: { danger: true },
          onOk: () => actions.deleteHosts.mutate(table.selectedRows as number[]),
        });
      }}
    >
      删除所选项
    </Button>,
  ];

  const columns = getColumns(
    editing,
    handleEditName,
    handleSaveName,
    handleAssignLabels,
    actions.deleteHosts.mutate,
    setEditing,
    hostList,
    table.selectedRows.length,
    batchActions,
  );

  return (
    <div className="flex h-full flex-col p-5">
      {/* 顶部操作栏 */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="relative w-64">
            <Input
              placeholder="搜索主机名称/操作系统"
              allowClear
              className="transition-all"
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
        <div className="flex items-center gap-2">
          <Button
            className="transition-all"
            icon={<Iconify icon="flowbite:tag-outline" />}
            onClick={() => open(ModalName.LabelManage)}
          >
            标签管理
          </Button>
          <Button
            type="primary"
            className="flex items-center transition-all"
            icon={<Iconify icon="flowbite:plus-outline" />}
            onClick={() => open(ModalName.Create)}
          >
            添加主机
          </Button>
        </div>
      </div>

      {/* 主机列表表格 */}
      <Table
        scroll={{ x: 'max-content' }}
        columns={columns}
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
    </div>
  );
}

export default HostManage;
