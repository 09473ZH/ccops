import { Space, Input, Popconfirm, Progress, Tooltip } from 'antd';
import { ColumnType } from 'antd/es/table';
import { Link } from 'react-router-dom';

import type { DiskInfo, HostInfo } from '@/api/services/host';
import type { LabelInfo } from '@/api/services/label';
import { ActionButton, CopyButton } from '@/components/Button';
import { OsIcon } from '@/components/Icon';
import ShowMoreTags from '@/components/ShowMoreTags';
import ShowTooltip from '@/components/ShowTooltip';
import { formatBytes } from '@/utils/format-number';
import { formatDateTime, formatTimeAgo } from '@/utils/format-time';

import { type EditingState } from '../../hooks';
import { StatusBadge } from '../StatusBadge';

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
  const id = `${record.id}`;
  window.open(`/host_manage/jump-server/${id}`, '_blank');
};

export const getColumns = (
  editing: EditingState,
  handleEditName: (record: HostInfo) => void,
  handleSaveName: () => void,
  handleAssignLabels: (record: HostInfo) => void,
  handleDeleteHost: (ids: number[]) => void,
  setEditingState: (state: Partial<EditingState>) => void,
  hostList: HostInfo[],
): ColumnType<HostInfo>[] => [
  {
    title: '主机名',
    dataIndex: 'name',
    key: 'name',
    fixed: 'left',
    width: 200,
    sorter: (a: HostInfo, b: HostInfo) => {
      return (a.name || '').localeCompare(b.name || '');
    },
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
    filterSearch: true,
    filters: Array.from(
      new Map(
        hostList
          .flatMap((host) => host.label || [])
          .map((label) => [label.id, { text: label.name, value: label.id }]),
      ).values(),
    ).sort((a, b) => a.text.localeCompare(b.text)),
    onFilter: (value: boolean | React.Key, record: HostInfo) => {
      return record.label?.some((label) => label.id === value) || false;
    },
    filterMultiple: true,
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
    title: <Tooltip title="最近5分钟内有心跳的主机为在线状态">状态</Tooltip>,
    dataIndex: 'fetchTime',
    key: 'status',
    filters: [
      { text: '在线', value: 'online' },
      { text: '离线', value: 'offline' },
    ],
    onFilter: (value: boolean | React.Key, record: HostInfo) => {
      const FIVE_MINUTES = 5 * 60 * 1000;
      const lastUpdateTime = record.fetchTime ? new Date(record.fetchTime).getTime() : 0;
      const isOnline = Date.now() - lastUpdateTime < FIVE_MINUTES;
      return String(value) === 'online' ? isOnline : !isOnline;
    },
    render: (fetchTime: string) => <StatusBadge fetchTime={fetchTime} />,
  },
  {
    title: '操作系统',
    dataIndex: 'operatingSystem',
    key: 'operatingSystem',
    filterSearch: true,
    filters: Array.from(
      new Set(hostList.filter((host) => host.operatingSystem).map((host) => host.operatingSystem)),
    )
      .map((os) => ({ text: os, value: os }))
      .sort((a, b) => a.text.localeCompare(b.text)),
    onFilter: (value: boolean | React.Key, record: HostInfo) => {
      return record.operatingSystem?.toLowerCase().includes(String(value).toLowerCase()) || false;
    },
    render: (operatingSystem: string) => <OsIcon osName={operatingSystem} />,
  },
  {
    title: 'CPU 品牌',
    dataIndex: 'cpuBrand',
    key: 'cpuBrand',
    filterSearch: true,
    filters: Array.from(
      new Set(hostList.filter((host) => host.cpuBrand).map((host) => host.cpuBrand)),
    )
      .map((cpu) => ({ text: cpu, value: cpu }))
      .sort((a, b) => a.text.localeCompare(b.text)),
    onFilter: (value: boolean | React.Key, record: HostInfo) => {
      return record.cpuBrand?.toLowerCase().includes(String(value).toLowerCase()) || false;
    },
  },
  {
    title: '内核版本',
    dataIndex: 'kernelVersion',
    key: 'kernelVersion',
    filterSearch: true,
    filters: Array.from(
      new Set(hostList.filter((host) => host.kernelVersion).map((host) => host.kernelVersion)),
    )
      .map((version) => ({ text: version, value: version }))
      .sort((a, b) => a.text.localeCompare(b.text)),
    onFilter: (value: boolean | React.Key, record: HostInfo) => {
      return record.kernelVersion?.toLowerCase().includes(String(value).toLowerCase()) || false;
    },
  },
  {
    title: '最后获取时间',
    dataIndex: 'fetchTime',
    key: 'fetchTime',
    sorter: (a: HostInfo, b: HostInfo) => {
      const timeA = a.fetchTime ? new Date(a.fetchTime).getTime() : 0;
      const timeB = b.fetchTime ? new Date(b.fetchTime).getTime() : 0;
      return timeA - timeB;
    },
    render: (fetchTime: string) => (
      <ShowTooltip content={formatTimeAgo(fetchTime)} tooltipContent={formatDateTime(fetchTime)} />
    ),
  },
  {
    title: '主机添加时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    sorter: (a: HostInfo, b: HostInfo) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    },
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
