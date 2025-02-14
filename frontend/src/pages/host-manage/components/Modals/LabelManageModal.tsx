import { Modal, Input, Button, Table, Space, Popconfirm } from 'antd';
import { useState } from 'react';

import type { LabelInfo } from '@/api/services/label';
import { ActionButton } from '@/components/Button';
import { Iconify } from '@/components/Icon';
import ShowMoreTags from '@/components/ShowMoreTags';

import { useLabelManagement } from '../../hooks';

import type { ColumnsType } from 'antd/es/table';

export function LabelManageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [createLabelValue, setCreateLabelValue] = useState('');

  const {
    labelList,
    hostsByLabel,
    hostCounts,
    operations: { createLabel, deleteLabel, unbindHostsLabel },
  } = useLabelManagement();

  const handleCreateLabel = () => {
    if (
      createLabelValue &&
      !labelList.some((label: LabelInfo) => label.name === createLabelValue)
    ) {
      createLabel.mutate(createLabelValue);
      setCreateLabelValue('');
    }
  };

  const columns: ColumnsType<LabelInfo> = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
      className: 'font-medium',
      filterSearch: true,
      filters: labelList.map((label) => ({ text: label.name, value: label.name })),
      onFilter: (value, record) => record.name.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: '绑定主机',
      dataIndex: 'id',
      key: 'hosts',
      render: (id: number) => {
        const hosts = hostsByLabel[id] || [];
        if (hosts.length === 0) return <span className="text-gray-400">-</span>;
        return <ShowMoreTags dataSource={hosts} maxCount={3} />;
      },
    },
    {
      title: '',
      key: 'action',
      width: 80,
      align: 'right',
      render: (_, record) => {
        const hostCount = hostCounts[record.id] || 0;
        return hostCount > 0 ? (
          <Popconfirm
            title="解除标签绑定"
            description={`确定要解除 ${hostCount} 台主机与该标签的绑定吗？`}
            okText="确定"
            cancelText="取消"
            onConfirm={() => unbindHostsLabel.mutate({ hostId: record.id, labelIds: [record.id] })}
          >
            <ActionButton icon="unlock" tooltip="解除绑定" />
          </Popconfirm>
        ) : (
          <Popconfirm
            title="删除标签"
            description="确定要删除这个标签吗？此操作不可恢复。"
            okText="确定"
            cancelText="取消"
            onConfirm={() => deleteLabel.mutate(record.id)}
            okButtonProps={{ danger: true }}
          >
            <ActionButton icon="delete" danger tooltip="删除" />
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Modal
      title="标签管理"
      open={open}
      onCancel={onClose}
      width={800}
      footer={null}
      styles={{
        body: {
          padding: '24px',
        },
      }}
    >
      <div className="space-y-3">
        <div className="flex justify-end">
          <Space.Compact>
            <Input
              value={createLabelValue}
              onChange={(e) => setCreateLabelValue(e.target.value)}
              placeholder="输入标签名称"
              maxLength={20}
              style={{ width: 200 }}
            />
            <Button
              type="primary"
              onClick={handleCreateLabel}
              disabled={
                !createLabelValue ||
                labelList.some((label: LabelInfo) => label.name === createLabelValue)
              }
            >
              新建标签
            </Button>
          </Space.Compact>
        </div>

        <Table
          columns={columns}
          dataSource={labelList}
          rowKey="id"
          pagination={false}
          scroll={{ y: 400 }}
          size="small"
          className="[&_.ant-table-thead_.ant-table-cell]:bg-gray-50/50"
        />

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Iconify icon="solar:info-circle-line-duotone" className="text-[14px]" />
          需要解除所有主机的绑定后才能删除标签
        </div>
      </div>
    </Modal>
  );
}
