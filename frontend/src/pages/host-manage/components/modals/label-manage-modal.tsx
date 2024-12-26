import { Modal, Input, Typography, Alert, Button, Tooltip, Popover, Space, Popconfirm } from 'antd';
import { useState, useMemo } from 'react';

import type { HostInfo } from '@/api/services/hostService';
import type { LabelInfo } from '@/api/services/labelService';
import { ActionButton } from '@/components/button';
import { Iconify } from '@/components/icon';

import { useLabelManagement } from '../../hooks';

interface LabelCardProps {
  label: LabelInfo;
  hostCount: number;
  hosts: HostInfo[];
  onDelete: (labelId: number) => void;
  onUnbind: (labelId: number) => void;
}

function LabelCard({ label, hostCount, hosts, onDelete, onUnbind }: LabelCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const renderHostList = () => (
    <div className="max-h-[300px] overflow-y-auto p-2">
      {hosts.map((host) => (
        <div key={host.id} className="mb-1 text-sm">
          {host.name}
        </div>
      ))}
    </div>
  );

  const handleUnbind = async () => {
    setIsLoading(true);
    try {
      await onUnbind(label.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white hover:bg-blue-50 hover:border-blue-200 flex items-center justify-between rounded-md border border-gray-100 p-2">
      <div className="flex items-center space-x-2">
        <div>
          <div className="text-sm font-medium">{label.name}</div>
          <div className="text-xs text-gray-500">
            <span>{hostCount} 台主机</span>
          </div>
        </div>
      </div>
      <Space>
        {hostCount > 0 ? (
          <>
            <Popover
              content={renderHostList()}
              title={`${label.name} 标签`}
              trigger="click"
              placement="left"
            >
              <ActionButton tooltip="查看绑定的主机" size="small" icon="host" />
            </Popover>
            <Popconfirm
              title="解除标签绑定"
              description={`确定要解除 ${hostCount} 台主机与该标签的绑定吗？`}
              okText="确定解除"
              cancelText="取消"
              onConfirm={handleUnbind}
            >
              <ActionButton
                loading={isLoading}
                size="small"
                icon="unlock"
                tooltip="解除所有主机绑定"
              />
            </Popconfirm>
          </>
        ) : (
          <Tooltip title="删除标签">
            <Popconfirm
              title="删除标签"
              description="确定要删除这个标签吗？此操作不可恢复。"
              okText="确定删除"
              cancelText="取消"
              onConfirm={() => onDelete(label.id)}
              okButtonProps={{ danger: true }}
            >
              <ActionButton size="small" icon="delete" danger />
            </Popconfirm>
          </Tooltip>
        )}
      </Space>
    </div>
  );
}

export function LabelManageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [labelTerm, setLabelTerm] = useState('');
  const [createLabelValue, setCreateLabelValue] = useState('');

  const {
    labelList,
    hostsByLabel,
    hostCounts,
    operations: { createLabel, deleteLabel, unbindHostsLabel },
  } = useLabelManagement();

  const filteredLabels = useMemo(
    () =>
      labelList.filter((label: LabelInfo) =>
        label.name.toLowerCase().includes(labelTerm.toLowerCase()),
      ),
    [labelList, labelTerm],
  );

  const handleCreateLabel = async () => {
    if (
      createLabelValue &&
      !labelList.some((label: LabelInfo) => label.name === createLabelValue)
    ) {
      await createLabel(createLabelValue);
      setCreateLabelValue('');
    }
  };

  return (
    <Modal title="标签管理" open={open} onCancel={onClose} width={600} footer={null}>
      <div className="space-y-4 p-4">
        {/* 创建标签区域 */}
        <div className="bg-gray-50 rounded-lg border border-gray-300 p-4">
          <Typography.Text strong className="mb-3 block">
            新建标签
          </Typography.Text>
          <div className="flex items-center gap-3">
            <Input
              value={createLabelValue}
              onChange={(e) => setCreateLabelValue(e.target.value)}
              placeholder="输入标签名称"
              maxLength={20}
            />
            <Button
              type="primary"
              onClick={handleCreateLabel}
              disabled={
                !createLabelValue || labelList.some((label) => label.name === createLabelValue)
              }
            >
              新建
            </Button>
          </div>
        </div>

        {/* 搜索区域 */}
        <Input
          placeholder="搜索标签"
          value={labelTerm}
          onChange={(e) => setLabelTerm(e.target.value)}
          allowClear
        />

        <Alert
          message="需要解除所有主机的绑定后才能删除标签"
          type="warning"
          showIcon
          className="mb-3"
        />

        {/* 标签列表 */}
        <div className="bg-gray-50 rounded-lg border border-gray-300 p-4">
          {filteredLabels.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center text-gray-500">
              <Iconify icon="solar:emoji-sad-circle-linear" width={48} height={48} />
              <p className="mt-2">暂无标签</p>
            </div>
          ) : (
            <div className="h-[300px] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-2">
                {filteredLabels.map((label) => (
                  <LabelCard
                    key={label.id}
                    label={label}
                    hostCount={hostCounts[label.id] || 0}
                    hosts={hostsByLabel[label.id] || []}
                    onDelete={deleteLabel}
                    onUnbind={unbindHostsLabel}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
