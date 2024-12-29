import { Modal, Button, Tabs, Typography } from 'antd';
import { useState } from 'react';

import { useCreateHostCommand } from '../../hooks/useHost';
import { TextAreaWithCopy } from '../text-area-with-copy';

interface CreateHostModalProps {
  open: boolean;
  onClose: () => void;
}

const osOptions = [
  { key: '1', label: 'Ubuntu/Debian', osFamily: 'debian' },
  { key: '2', label: 'CentOS', osFamily: 'redhat' },
];

export function CreateHostModal({ open, onClose }: CreateHostModalProps) {
  const [osFamily, setOsFamily] = useState<string>('debian');
  const { data: commandData, isLoading, error } = useCreateHostCommand(osFamily);

  const getContent = (currentOs: string) => {
    if (currentOs !== osFamily) return '切换标签加载';
    if (isLoading) return '加载中...';
    if (error) return error.toString();
    return (typeof commandData === 'string' ? commandData : commandData?.command) || '';
  };

  const items = osOptions.map(({ key, label, osFamily: os }) => ({
    key,
    label,
    children: <TextAreaWithCopy content={getContent(os)} />,
  }));

  const handleTabChange = (key: string) => {
    const selectedOs = osOptions.find((opt) => opt.key === key)?.osFamily || 'debian';
    setOsFamily(selectedOs);
  };

  return (
    <Modal
      title="创建新主机"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
      ]}
      width={800}
    >
      <div className="my-4">
        <Typography.Title level={5}>运行以下命令：</Typography.Title>
        <Tabs defaultActiveKey="1" items={items} onChange={handleTabChange} />
      </div>
    </Modal>
  );
}
