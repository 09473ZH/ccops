import { PlusOutlined } from '@ant-design/icons';
import { Modal, Select, Input, Space, Button } from 'antd';
import isEqual from 'lodash/isEqual';
import { useState, useCallback } from 'react';

import { useHostStore, useLabelManagement } from '@/pages/host-manage/hooks';

export function AssignLabelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [newLabelName, setNewLabelName] = useState('');
  const { labelAssign, setLabelAssign } = useHostStore();

  const {
    hostList,
    options,
    operations: { createLabel, assignLabel },
  } = useLabelManagement();

  const handleOk = async () => {
    if (!labelAssign.hostId) return;
    const currentLabelIds =
      hostList
        .find((h: { id: number | null }) => h.id === labelAssign.hostId)
        ?.label?.map((l: { id: number | null }) => l.id) || [];
    if (isEqual(new Set(currentLabelIds), new Set(labelAssign.selectedLabels))) {
      onClose();
      return;
    }
    assignLabel.mutate({
      hostId: labelAssign.hostId,
      labelIds: labelAssign.selectedLabels,
    });
    onClose();
  };

  const handleCreateLabel = useCallback(async () => {
    if (!newLabelName) return;
    createLabel.mutate(newLabelName);
    setNewLabelName('');
  }, [newLabelName, createLabel]);

  return (
    <Modal title="分配标签" open={open} onCancel={onClose} onOk={handleOk} width={500}>
      <Space.Compact className="mb-4 w-full">
        <Input
          placeholder="输入标签名称"
          value={newLabelName}
          onChange={(e) => setNewLabelName(e.target.value)}
          onPressEnter={handleCreateLabel}
        />
        <Button icon={<PlusOutlined />} onClick={handleCreateLabel} disabled={!newLabelName}>
          创建
        </Button>
      </Space.Compact>
      <Space direction="vertical" className="w-full" size="middle">
        <Select
          mode="multiple"
          className="w-full"
          placeholder="选择标签"
          value={labelAssign.selectedLabels}
          onChange={(values) => setLabelAssign({ selectedLabels: values })}
          options={options}
          showSearch
          optionFilterProp="label"
          listHeight={300}
        />
      </Space>
    </Modal>
  );
}
