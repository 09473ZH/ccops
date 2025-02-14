import { Alert, Table } from 'antd';
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

import type { HostInfo } from '@/api/services/host';
import { BackableTabs } from '@/components/BackableTabs';
import { CircleLoading } from '@/components/Loading';
import ShowMoreTags from '@/components/ShowMoreTags';
import { useBreadcrumbStore } from '@/store/breadcrumb';
import { formatTimeAgo } from '@/utils/format-time';

import { StatusBadge } from '../components/StatusBadge';
import { useHostDetail } from '../hooks';

// 定义配置类型
type InfoConfig = {
  label: string;
  getValue: (hostInfo: HostInfo) => React.ReactNode;
};

type SectionConfig = {
  title: string;
  items: InfoConfig[];
  cols?: number;
};

const allItems: Record<string, SectionConfig> = {
  basic: {
    title: '基础信息',
    items: [
      { label: '主机名称', getValue: (host) => host.name },
      { label: '主机 IP', getValue: (host) => host.hostServerUrl },
      { label: 'UUID', getValue: (host) => host.uuid },
      { label: 'MAC 地址', getValue: (host) => host.primaryMac || '--' },
      {
        label: '标签',
        getValue: (host) =>
          host.label.length > 0 ? (
            <ShowMoreTags
              dataSource={host.label}
              labelField="name"
              maxCount={3}
              style={{ gap: '8px' }}
              tagStyle={{
                fontSize: '12px',
                padding: '2px 10px',
                margin: '2px 0',
              }}
            />
          ) : (
            <span className="text-gray-500 dark:text-gray-400">暂无标签</span>
          ),
      },
    ],
  },
  system: {
    title: '系统信息',
    items: [
      {
        label: '操作系统',
        getValue: (host) => (
          <span className="text-gray-700 dark:text-gray-200">
            {host.operatingSystem}
            <span className="text-gray-500 dark:text-gray-400"> {host.version}</span>
          </span>
        ),
      },
      { label: '系统架构', getValue: (host) => host.arch },
      { label: '内核版本', getValue: (host) => host.kernelVersion },
      { label: '平台', getValue: (host) => host.platform },
      {
        label: '运行时间',
        getValue: (host) => `${Math.floor(Number(host.totalUptimeSeconds) / 3600)} 小时`,
      },
    ],
  },
  hardware: {
    title: '硬件信息',
    items: [
      {
        label: '内存大小',
        getValue: (host) => {
          const memoryInGB = (parseInt(host.physicalMemory, 10) / (1024 * 1024 * 1024)).toFixed(1);
          return `${memoryInGB} GB`;
        },
      },
      { label: '硬件型号', getValue: (host) => host.hardwareModel },
      { label: '硬件版本', getValue: (host) => host.hardwareVersion },
      { label: '硬件厂商', getValue: (host) => host.hardwareVendor },
      {
        label: 'CPU 信息',
        getValue: (host) => (
          <>
            <div className="text-gray-700 dark:text-gray-200">{host.cpuBrand}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {host.cpuPhysicalCores} 物理核心 / {host.cpuLogicalCores} 逻辑核心
            </div>
          </>
        ),
      },
      { label: 'CPU 类型', getValue: (host) => host.cpuType },
      { label: 'CPU 插槽', getValue: (host) => `${host.cpuSockets} 个` },
      { label: 'CPU 微码', getValue: (host) => host.cpuMicrocode },
    ],
  },
  board: {
    title: '主板信息',
    items: [
      { label: '主板型号', getValue: (host) => host.boardModel || '--' },
      { label: '主板厂商', getValue: (host) => host.boardVendor || '--' },
      { label: '主板版本', getValue: (host) => host.boardVersion || '--' },
      { label: '主板序列号', getValue: (host) => host.boardSerial || '--' },
    ],
  },
  time: {
    title: '',
    cols: 3,
    items: [
      { label: '获取时间', getValue: (host) => formatTimeAgo(host.fetchTime) },
      { label: '启动时间', getValue: (host) => formatTimeAgo(host.startTime) },
      { label: '创建时间', getValue: (host) => formatTimeAgo(host.createdAt) },
    ],
  },
};

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center rounded-md px-2 py-2.5 hover:bg-gray-100/60 dark:hover:bg-gray-700/30">
      <span className="w-20 text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
      <span className="flex-1 text-sm text-gray-900 dark:text-gray-200">{value}</span>
    </div>
  );
}

function InfoSection({ config, hostInfo }: { config: SectionConfig; hostInfo: HostInfo }) {
  if (!config.items.length) return null;

  return (
    <div className="mb-8">
      {config.title && (
        <div className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-200">
          {config.title}
        </div>
      )}
      <div className={`grid grid-cols-${config.cols || 2} gap-x-20`}>
        {config.items.map((item) => (
          <InfoItem key={item.label} label={item.label} value={item.getValue(hostInfo)} />
        ))}
      </div>
    </div>
  );
}

function BasicInfo({ hostInfo }: { hostInfo: HostInfo }) {
  return (
    <div className="mx-4 mt-3">
      <div className="rounded-lg border border-gray-200 shadow-sm transition-all duration-300 dark:border-gray-700">
        {/* 状态信息 */}
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <StatusBadge fetchTime={hostInfo.fetchTime} />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              最后更新于 {formatTimeAgo(hostInfo.updatedAt)}
            </span>
          </div>
        </div>

        {/* 主要信息 */}
        <div className="p-6">
          {['basic', 'system', 'hardware', 'board'].map((key) => (
            <InfoSection key={key} config={allItems[key]} hostInfo={hostInfo} />
          ))}
        </div>

        {/* 时间信息 */}
        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <InfoSection config={allItems.time} hostInfo={hostInfo} />
        </div>
      </div>
    </div>
  );
}

function HostDetail(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const hostId = Number(id);
  const { data: hostInfo, isLoading, error } = useHostDetail(hostId);
  const { setCustomBreadcrumbs } = useBreadcrumbStore();

  useEffect(() => {
    setCustomBreadcrumbs([
      {
        key: 'host_manage',
        title: <Link to="/host_manage">主机管理</Link>,
      },
      {
        key: 'detail',
        title: `${hostInfo?.name || ''} 详情`,
      },
    ]);
    return () => {
      setCustomBreadcrumbs(undefined);
    };
  }, [hostInfo?.name, setCustomBreadcrumbs]);

  if (isLoading) return <CircleLoading />;
  if (error) return <Alert message="错误" description={error?.toString()} type="error" showIcon />;
  if (!hostInfo) return <Alert message="未找到主机信息" type="warning" showIcon />;

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: <BasicInfo hostInfo={hostInfo} />,
    },
    /** 磁盘信息 暂时不展示 */
    // {
    //   key: 'disk',
    //   label: '磁盘信息',
    //   children: (
    //     <Table
    //       columns={[
    //         { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    //         {
    //           title: '可用空间',
    //           dataIndex: 'diskSpaceAvailable',
    //           key: 'diskSpaceAvailable',
    //           render: (value: number) => `${value.toFixed(1)} GB`,
    //         },
    //         {
    //           title: '总空间',
    //           dataIndex: 'totalDiskSpace',
    //           key: 'totalDiskSpace',
    //           render: (value: number) => `${value.toFixed(1)} GB`,
    //         },
    //         {
    //           title: '可用比例',
    //           dataIndex: 'percentDiskSpaceAvailable',
    //           key: 'percentDiskSpaceAvailable',
    //           render: (value: string) => `${value}%`,
    //         },
    //         {
    //           title: '加密状态',
    //           dataIndex: 'encrypted',
    //           key: 'encrypted',
    //           render: (value: boolean) => (value ? '已加密' : '未加密'),
    //         },
    //         {
    //           title: '创建时间',
    //           dataIndex: 'createdAt',
    //           key: 'createdAt',
    //           render: (text: string) => formatTimeAgo(text),
    //         },
    //       ]}
    //       dataSource={hostInfo.disk}
    //       rowKey="id"
    //       pagination={false}
    //       size="small"
    //     />
    //   ),
    // },
    {
      key: 'users',
      label: '用户信息',
      children: (
        <Table
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
            { title: '用户', dataIndex: 'userName', key: 'userName' },
            { title: 'Shell', dataIndex: 'shell', key: 'shell' },
            {
              title: '创建时间',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (text: string) => formatTimeAgo(text),
            },
          ]}
          dataSource={hostInfo.hostUser}
          rowKey="id"
          pagination={false}
          size="small"
        />
      ),
    },
    {
      key: 'software',
      label: '软件信息',
      children: (
        <Table
          columns={[
            { title: '名称', dataIndex: 'name', key: 'name' },
            { title: '版本', dataIndex: 'version', key: 'version' },
            { title: '型', dataIndex: 'type', key: 'type' },
            {
              title: '创建时间',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (text: string) => formatTimeAgo(text),
            },
          ]}
          dataSource={hostInfo.software}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ y: 'calc(100vh - 220px)' }}
        />
      ),
    },
  ];

  return (
    <div>
      <BackableTabs
        title={hostInfo.name}
        backPath="/host_manage"
        items={tabItems}
        defaultActiveKey="basic"
      />
    </div>
  );
}
export default HostDetail;
