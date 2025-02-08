import { Modal, Button, Tabs, Typography, Space } from 'antd';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import configService from '@/api/services/config';
import useSystemConfigStore from '@/pages/system-config/hooks/use-system-config-store';

import { TextAreaWithCopy } from '../TextAreaWithCopy';

interface OsOption {
  key: string;
  label: string;
  osFamily: string;
  getCommand: (baseApi: string) => string;
}

const osOptions: OsOption[] = [
  {
    key: '1',
    label: 'Linux',
    osFamily: 'linux',
    getCommand: (baseApi: string) => `curl -L ${baseApi}/api/install | bash`,
  },
];

interface CreateHostModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateHostModal({ open, onClose }: CreateHostModalProps) {
  const [baseApi, setBaseApi] = useState<string>('');
  const navigate = useNavigate();
  const { setActiveKeys, setIsAccordion } = useSystemConfigStore();

  useEffect(() => {
    const checkBaseApi = async () => {
      const value = await configService.getConfigValue('system', 'ServerUrl');
      if (value) {
        setBaseApi(value);
      }
    };

    if (open) {
      checkBaseApi();
    }
  }, [open]);

  const handleConfigClick = () => {
    onClose();
    setIsAccordion(false);
    setActiveKeys(['system-config']);
    navigate('/system_settings#system-config');
  };

  const items = osOptions.map(({ key, label, getCommand }) => ({
    key,
    label,
    children: baseApi ? (
      <div>
        <Typography.Text type="secondary" className="mb-2 block">
          在终端中运行:
        </Typography.Text>
        <TextAreaWithCopy content={getCommand(baseApi)} />
      </div>
    ) : (
      <div className="py-4 text-center">
        <Space direction="vertical">
          <Typography.Text type="warning">未配置系统基础API地址</Typography.Text>
          <Button type="primary" onClick={handleConfigClick}>
            前往系统配置
          </Button>
        </Space>
      </div>
    ),
  }));

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
        <Tabs defaultActiveKey="1" items={items} />
      </div>
    </Modal>
  );
}
