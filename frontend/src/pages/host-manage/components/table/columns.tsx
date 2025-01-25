import { Space, Input, Popconfirm, Progress, Tooltip } from 'antd';
import { ColumnType } from 'antd/es/table';
import { Link } from 'react-router-dom';

import type { DiskInfo, HostInfo } from '@/api/services/hostService';
import { LabelInfo } from '@/api/services/labelService';
import ActionButton from '@/components/button/action-button';
import CopyButton from '@/components/button/copy-button';
import { Iconify, OsIcon } from '@/components/icon';
import ShowMoreTags from '@/components/show-more-tags';
import ShowTooltip from '@/components/show-tooltip';
import { formatBytes } from '@/utils/format-number';
import { formatDateTime, formatTimeAgo } from '@/utils/format-time';

import { type EditingState } from '../../hooks';
import { StatusBadge } from '../status-badge';

export interface ColumnGroup {
  title: string;
  key: string;
  children: { title: string; key: string }[];
}

export const getColumnGroups = (): ColumnGroup[] => [
  {
    title: '基本信息',
    key: 'basic',
    children: [
      { title: 'IP 地址', key: 'hostServerUrl' },
      { title: '标签', key: 'label' },
      { title: '状态', key: 'status' },
      { title: '操作系统', key: 'operatingSystem' },
    ],
  },
  {
    title: '硬件信息',
    key: 'hardware',
    children: [
      { title: '内存大小', key: 'physicalMemory' },
      { title: '磁盘占用情况', key: 'disk' },
      { title: 'CPU 品牌', key: 'cpuBrand' },
    ],
  },
  {
    title: '其他信息',
    key: 'other',
    children: [
      { title: '内核版本', key: 'kernelVersion' },
      { title: '最后获取时间', key: 'fetchTime' },
      { title: '主机添加时间', key: 'createdAt' },
    ],
  },
];

const handleJumpServer = (record: HostInfo) => {
  const id = `${record.id}|${encodeURIComponent(record.name)}|${encodeURIComponent(
    record.hostServerUrl,
  )}`;
  window.open(`/host_manage/jump-server/${id}`, '_blank');
};

export const getColumns = (
  editing: EditingState,
  handleEditName: (record: HostInfo) => void,
  handleSaveName: () => void,
  handleAssignLabels: (record: HostInfo) => void,
  handleDeleteHost: (ids: number[]) => void,
  setEditingState: (state: Partial<EditingState>) => void,
): ColumnType<HostInfo>[] => [
  {
    title: '主机名',
    dataIndex: 'name',
    key: 'name',
    fixed: 'left',
    width: 200,
    render: (_: any, record: HostInfo) => {
      if (editing.action === 'edit' && editing.id === record.id) {
        return (
          <Input
            ref={(input) => input && input.focus()}
            value={editing.name}
            onChange={(e) => {
              setEditingState({
                hostServerUrl: editing.hostServerUrl,
                name: e.target.value,
              });
            }}
          />
        );
      }
      return <Link to={`/host_manage/detail/${record.id}`}>{record.name}</Link>;
    },
  },
  {
    title: 'IP 地址',
    dataIndex: 'hostServerUrl',
    key: 'hostServerUrl',
    render: (hostServerUrl: string) => (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: 8 }}>{hostServerUrl}</span>
        <CopyButton text={hostServerUrl} />
      </div>
    ),
  },
  {
    title: '标签',
    dataIndex: 'label',
    key: 'label',
    render: (label: LabelInfo[]) => (
      <ShowMoreTags
        dataSource={label.map((label) => ({ id: label.id, name: label.name }))}
        labelField="name"
        color="blue"
      />
    ),
  },
  {
    title: '内存大小',
    dataIndex: 'physicalMemory',
    key: 'physicalMemory',
    render: (physicalMemory: number) => {
      if (!physicalMemory) return <>--</>;
      return formatBytes(physicalMemory);
    },
  },
  {
    title: '磁盘占用情况',
    dataIndex: 'disk',
    key: 'disk',
    width: 130,
    render: (disk: DiskInfo[]) => {
      if (!disk || disk.length === 0) return <>--</>;
      const { diskSpaceAvailable: space, totalDiskSpace: totalSpace } = disk[0];
      const percent = (space / totalSpace) * 100;
      return renderDiskSpace(space, totalSpace, percent);
    },
  },
  {
    title: '状态',
    dataIndex: 'fetchTime',
    key: 'status',
    render: (fetchTime: string) => <StatusBadge fetchTime={fetchTime} />,
  },
  {
    title: '操作系统',
    dataIndex: 'operatingSystem',
    key: 'operatingSystem',
    render: (operatingSystem: string) => <OsIcon osName={operatingSystem} />,
  },
  {
    title: 'CPU 品牌',
    dataIndex: 'cpuBrand',
    key: 'cpuBrand',
  },
  {
    title: '内核版本',
    dataIndex: 'kernelVersion',
    key: 'kernelVersion',
  },
  {
    title: '最后获取时间',
    dataIndex: 'fetchTime',
    key: 'fetchTime',
    render: (fetchTime: string) => (
      <ShowTooltip content={formatTimeAgo(fetchTime)} tooltipContent={formatDateTime(fetchTime)} />
    ),
  },
  {
    title: '主机添加时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (createdAt: string) => (
      <ShowTooltip content={formatTimeAgo(createdAt)} tooltipContent={formatDateTime(createdAt)} />
    ),
  },
  {
    title: '操作',
    key: 'action',
    align: 'center',
    fixed: 'right',
    width: 150,
    render: (_: any, record: HostInfo) => {
      if (editing.action === 'edit' && editing.id === record.id) {
        return (
          <Space>
            <ActionButton
              type="text"
              icon="cancel"
              onClick={() => {
                setEditingState({
                  id: null,
                  name: '',
                  action: null,
                });
              }}
            />
            <ActionButton icon="save" onClick={handleSaveName} />
          </Space>
        );
      }
      return (
        <Space>
          <ActionButton
            icon="terminal"
            onClick={() => handleJumpServer(record)}
            tooltip="连接终端"
          />
          <ActionButton
            aria-label={`编辑主机 ${record.name}`}
            icon="edit"
            onClick={() => handleEditName(record)}
          />
          <ActionButton icon="tag" onClick={() => handleAssignLabels(record)} />
          <Popconfirm
            title="确定要删除这个主机吗？"
            onConfirm={() => handleDeleteHost([record.id])}
            okText="确定"
            cancelText="取消"
          >
            <ActionButton icon="delete" danger />
          </Popconfirm>
        </Space>
      );
    },
  },
];
function renderDiskSpace(space: number, totalSpace: number, percent: number) {
  if (totalSpace === 0) return <>--</>;

  let strokeColor = '#87d068';
  const usedPercent = 100 - percent;

  if (usedPercent > 80 && usedPercent < 90) {
    strokeColor = '#FB9800';
  } else if (usedPercent >= 90) {
    strokeColor = '#e55649';
  }

  return (
    <Tooltip title={`可用：${space.toFixed(2)} GB 总量：${totalSpace.toFixed(2)} GB`}>
      <Progress
        strokeLinecap="butt"
        percent={usedPercent}
        size={[120, 10]}
        strokeColor={strokeColor}
        format={() => `${usedPercent.toFixed(2)}%`}
      />
    </Tooltip>
  );
}
