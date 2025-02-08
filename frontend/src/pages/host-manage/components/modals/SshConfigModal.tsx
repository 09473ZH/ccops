import { Modal, Button } from 'antd';
import { Key, useEffect, useMemo, useState } from 'react';

import type { HostInfo } from '@/api/services/host';

import { TextAreaWithCopy } from '../TextAreaWithCopy';

interface SshConfigModalProps {
  hostList: HostInfo[];
  selectedRows: Key[];
  open: boolean;
  onClose: () => void;
}

export function SshConfigModal({ hostList, selectedRows, open, onClose }: SshConfigModalProps) {
  const [sshConfig, setSshConfig] = useState('');
  const selectedHosts = useMemo(
    () => (hostList || []).filter((host) => selectedRows.includes(host.id)) ?? [],
    [hostList, selectedRows],
  );

  useEffect(() => {
    const generateSshConfig = () => {
      const formatHostConfig = (host: HostInfo) => {
        const indent = ' '.repeat(4);
        return [
          `Host ${host.name}`,
          `${indent}HostName ${host.hostServerUrl}`,
          `${indent}User root`,
          `${indent}IdentityFile ~/.ssh/corgiclub`,
        ].join('\n');
      };
      const config = selectedHosts.map(formatHostConfig).join('\n\n');
      setSshConfig(config);
    };
    generateSshConfig();
  }, [selectedHosts]);

  return (
    <Modal
      title="SSH 配置"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
      ]}
    >
      <div className="relative">
        <TextAreaWithCopy
          content={sshConfig}
          onChange={(value: string) => setSshConfig(value)}
          minRows={6}
        />
      </div>
    </Modal>
  );
}
