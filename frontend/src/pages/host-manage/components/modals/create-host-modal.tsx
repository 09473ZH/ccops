import { Modal, Button, Tabs, Typography } from 'antd';

import { TextAreaWithCopy } from '../text-area-with-copy';

interface CreateHostModalProps {
  open: boolean;
  onClose: () => void;
}
const commands = [
  {
    key: '1',
    label: 'Ubuntu/Debian',
    command: `export DEBIAN_FRONTEND=noninteractive && curl -L -o /tmp/zerotier.deb "http://cdn.corgi.plus/ccops/zerotier-one_1.14.2_amd64_$(lsb_release -c -s).deb" && apt install -y -f /tmp/zerotier.deb && zerotier-cli join b6079f73c6b00640 && curl -L -o /tmp/osquery.deb http://cdn.corgi.plus/ccops/osquery_5.13.1-1.linux_amd64.deb && dpkg -i /tmp/osquery.deb && curl -o /tmp/ccagent.tgz http://cdn.corgi.plus/ccops/ccagent.tgz && tar zxvf /tmp/ccagent.tgz -C /usr/local/bin && /usr/local/bin/ccagent -action install -server ${
      import.meta.env.VITE_CCSERVER_URL
    }`,
  },
  {
    key: '2',
    label: 'CentOS',
    command: `curl -L -o /tmp/osquery.rpm http://cdn.corgi.plus/ccops/osquery-5.13.1-1.linux.x86_64.rpm && sudo yum install /tmp/osquery.rpm && curl -o /tmp/ccagent.tgz http://cdn.corgi.plus/ccops/ccagent.tgz && tar zxvf /tmp/ccagent.tgz -C /usr/local/bin && /usr/local/bin/ccagent -action install -server ${
      import.meta.env.VITE_CCSERVER_URL
    }`,
  },
];

export function CreateHostModal({ open, onClose }: CreateHostModalProps) {
  const items = commands.map(({ key, label, command }) => ({
    key,
    label,
    children: <TextAreaWithCopy content={command} />,
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
        <Typography.Title level={5}>运行以下命令：</Typography.Title>
        <Tabs defaultActiveKey="1" items={items} />
      </div>
    </Modal>
  );
}
