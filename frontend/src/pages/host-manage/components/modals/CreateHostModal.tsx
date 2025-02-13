import { Modal, Button, Tabs, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

import { TextAreaWithCopy } from '@/components/TextAreaWithCopy';
import useSystemConfigStore from '@/pages/system-config/hooks/use-system-config-store';

import { useServerUrl } from '../../hooks';

interface CreateHostModalProps {
  open: boolean;
  onClose: () => void;
}

interface OsOption {
  key: string;
  label: string;
  osFamily: string;
  getCommand: (baseApi: string) => string;
}

const HOST_COMMANDS: OsOption[] = [
  {
    key: 'linux',
    label: 'Linux',
    osFamily: 'linux',
    getCommand: (baseApi: string) => `curl -L ${baseApi}/api/install | bash`,
  },
];

export function CreateHostModal({ open, onClose }: CreateHostModalProps) {
  const navigate = useNavigate();
  const { setActiveKeys, setIsAccordion } = useSystemConfigStore();

  const { data: baseApi } = useServerUrl();

  const handleConfigClick = () => {
    onClose();
    setIsAccordion(false);
    setActiveKeys(['system-config']);
    navigate('/system_settings#system-config');
  };

  const renderCommandContent = (command: string) => (
    <div>
      <Typography.Text type="secondary" className="mb-2 block">
        在终端中运行:
      </Typography.Text>
      <TextAreaWithCopy content={command} />
    </div>
  );

  const renderConfigPrompt = () => (
    <div className="py-4 text-center">
      <Space direction="vertical">
        <Typography.Text type="warning">未配置系统基础API地址</Typography.Text>
        <Button type="primary" onClick={handleConfigClick}>
          前往系统配置
        </Button>
      </Space>
    </div>
  );

  const items = HOST_COMMANDS.map(({ key, label, getCommand }) => ({
    key,
    label,
    children: baseApi ? renderCommandContent(getCommand(baseApi)) : renderConfigPrompt(),
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
        <Tabs defaultActiveKey={HOST_COMMANDS[0].key} items={items} />
      </div>
    </Modal>
  );
}
