import { Modal, Input, Button, Table, Space, Popconfirm } from 'antd';
import { useState } from 'react';

import type { AnnotationInfo } from '@/api/services/annotation';
import { ActionButton } from '@/components/Button';
import { Iconify } from '@/components/Icon';
import ShowMoreTags from '@/components/ShowMoreTags';

import { useAnnotationManagement } from '../../hooks';

import type { ColumnsType } from 'antd/es/table';

export function AnnotationManageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [createAnnotationName, setCreateAnnotationName] = useState('');
  const [createAnnotationValue, setCreateAnnotationValue] = useState('');

  const {
    annotationList,
    hostsByAnnotation,
    hostCounts,
    operations: { createAnnotation, deleteAnnotation, unbindHostsAnnotation },
  } = useAnnotationManagement();

  const handleCreateAnnotation = () => {
    if (
      createAnnotationName &&
      createAnnotationValue &&
      !annotationList.some((annotation: AnnotationInfo) => 
        annotation.name === createAnnotationName && annotation.value === createAnnotationValue)
    ) {
      createAnnotation.mutate({ name: createAnnotationName, value: createAnnotationValue });
      setCreateAnnotationName('');
      setCreateAnnotationValue('');
    }
  };

  const columns: ColumnsType<AnnotationInfo> = [
    {
      title: '注解名称',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
      className: 'font-medium',
      filterSearch: true,
      filters: annotationList.map((annotation) => ({ text: annotation.name, value: annotation.name })),
      onFilter: (value, record) => record.name.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: '注解值',
      dataIndex: 'value',
      key: 'value',
      width: '25%',
      className: 'font-medium',
      filterSearch: true,
      filters: annotationList.map((annotation) => ({ text: annotation.value, value: annotation.value })),
      onFilter: (value, record) => record.value.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: '绑定主机',
      dataIndex: 'id',
      key: 'hosts',
      render: (id: number) => {
        const hosts = hostsByAnnotation[id] || [];
        if (hosts.length === 0) return <span className="text-gray-400">-</span>;
        return <ShowMoreTags dataSource={hosts} maxCount={3} />;
      },
    },
    {
      title: '',
      key: 'action',
      width: 80,
      align: 'right',
      render: (_, record) => {
        const hostCount = hostCounts[record.id] || 0;
        return hostCount > 0 ? (
          <Popconfirm
            title="解除注解绑定"
            description={`确定要解除 ${hostCount} 台主机与该注解的绑定吗？`}
            okText="确定"
            cancelText="取消"
            onConfirm={() => unbindHostsAnnotation.mutate({ annotationId: record.id })}
          >
            <ActionButton icon="unlock" tooltip="解除绑定" />
          </Popconfirm>
        ) : (
          <Popconfirm
            title="删除注解"
            description="确定要删除这个注解吗？此操作不可恢复。"
            okText="确定"
            cancelText="取消"
            onConfirm={() => deleteAnnotation.mutate(record.id)}
            okButtonProps={{ danger: true }}
          >
            <ActionButton icon="delete" danger tooltip="删除" />
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Modal
      title="注解管理"
      open={open}
      onCancel={onClose}
      width={900}
      footer={null}
      styles={{
        body: {
          padding: '24px',
        },
      }}
    >
      <div className="space-y-3">
        <div className="flex justify-end">
          <Space.Compact>
            <Input
              value={createAnnotationName}
              onChange={(e) => setCreateAnnotationName(e.target.value)}
              placeholder="注解名称 (如: server/env)"
              maxLength={100}
              style={{ width: 200 }}
            />
            <Input
              value={createAnnotationValue}
              onChange={(e) => setCreateAnnotationValue(e.target.value)}
              placeholder="注解值 (如: prod)"
              maxLength={200}
              style={{ width: 150 }}
            />
            <Button
              type="primary"
              onClick={handleCreateAnnotation}
              disabled={
                !createAnnotationName ||
                !createAnnotationValue ||
                annotationList.some((annotation: AnnotationInfo) => 
                  annotation.name === createAnnotationName && annotation.value === createAnnotationValue)
              }
            >
              新建注解
            </Button>
          </Space.Compact>
        </div>

        <Table
          columns={columns}
          dataSource={annotationList}
          rowKey="id"
          pagination={false}
          scroll={{ y: 400 }}
          size="small"
          className="[&_.ant-table-thead_.ant-table-cell]:bg-gray-50/50"
        />

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Iconify icon="solar:info-circle-line-duotone" className="text-[14px]" />
          需要解除所有主机的绑定后才能删除注解
        </div>
      </div>
    </Modal>
  );
}
