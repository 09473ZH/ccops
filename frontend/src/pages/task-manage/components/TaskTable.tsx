import { Table, Space, Popconfirm } from 'antd';

import { RoleDetails, TaskInfo } from '@/api/services/task';
import ActionButton from '@/components/Button/ActionButton';
import ShowMoreTags from '@/components/ShowMoreTags';
import ShowTooltip from '@/components/ShowTooltip';
import { formatDateTime, formatTimeAgo } from '@/utils/format-time';

import RoleDetailsList from './RoleDetailsList';

import type { ColumnsType } from 'antd/es/table';

interface TaskTableProps {
  loading: boolean;
  dataSource: TaskInfo[];
  pagination: any;
  rowSelection: any;
  onTableChange: (pagination: any) => void;
  onViewOutput: (taskId: number) => void;
  onRestart: (record: TaskInfo) => void;
  onDelete: (taskId: number) => void;
}

export function TaskTable({
  loading,
  dataSource,
  pagination,
  rowSelection,
  onTableChange,
  onViewOutput,
  onRestart,
  onDelete,
}: TaskTableProps) {
  const columns: ColumnsType<TaskInfo> = [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 180,
      render: (text: string) => <ShowTooltip maxWidth={180} content={text} tooltipContent={text} />,
    },
    {
      title: '主机列表',
      dataIndex: 'hosts',
      key: 'hosts',
      render: (hosts: TaskInfo['hosts']) => (
        <Space wrap>
          <ShowMoreTags
            dataSource={(hosts || []).map((host) => ({
              id: host.hostId,
              name: host.hostname,
            }))}
            labelField="name"
          />
        </Space>
      ),
    },
    {
      title: '软件列表',
      dataIndex: 'roleDetails',
      key: 'roleDetails',
      render: (roleDetails: RoleDetails) => <RoleDetailsList roleDetails={roleDetails} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => (
        <ShowTooltip content={formatTimeAgo(text)} tooltipContent={formatDateTime(text)} />
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (text: string) => (
        <ShowTooltip content={formatTimeAgo(text)} tooltipContent={formatDateTime(text)} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record: TaskInfo) => (
        <Space>
          <ActionButton icon="view" onClick={() => onViewOutput(record.id)} />
          <ActionButton
            icon="replay"
            onClick={() => onRestart(record)}
            disabled={record.type !== 'playbook'}
            tooltip={record.type !== 'playbook' ? '快捷命令任务不支持重启' : '重启任务'}
          />
          <Popconfirm
            title="确认删除"
            description="您确定要删除这个任务吗？此操作不可逆。"
            onConfirm={() => onDelete(record.id)}
          >
            <ActionButton type="link" icon="delete" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      scroll={{ x: 'max-content' }}
      rowSelection={rowSelection}
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
      loading={loading}
      pagination={pagination}
      onChange={onTableChange}
    />
  );
}
