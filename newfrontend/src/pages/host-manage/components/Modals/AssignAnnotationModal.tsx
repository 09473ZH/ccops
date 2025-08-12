import { PlusOutlined } from '@ant-design/icons';
import { Modal, Select, Input, Space, Button } from 'antd';
import isEqual from 'lodash/isEqual';
import { useState, useCallback } from 'react';

import { useHostStore, useAnnotationManagement } from '@/pages/host-manage/hooks';

export function AssignAnnotationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [newAnnotationName, setNewAnnotationName] = useState('');
  const [newAnnotationValue, setNewAnnotationValue] = useState('');
  const { annotationAssign, setAnnotationAssign } = useHostStore();

  const {
    hostList,
    options,
    operations: { createAnnotation, assignAnnotation },
  } = useAnnotationManagement();

  const handleOk = async () => {
    if (!annotationAssign.hostId) return;
    const currentAnnotationIds =
      hostList
        .find((h: { id: number | null }) => h.id === annotationAssign.hostId)
        ?.annotations?.map((a: { id: number | null }) => a.id) || [];
    if (isEqual(new Set(currentAnnotationIds), new Set(annotationAssign.selectedAnnotations))) {
      onClose();
      return;
    }
    assignAnnotation.mutate({
      hostId: annotationAssign.hostId,
      annotationIds: annotationAssign.selectedAnnotations,
    });
    onClose();
  };

  const handleCreateAnnotation = useCallback(async () => {
    if (!newAnnotationName || !newAnnotationValue) return;
    createAnnotation.mutate({ name: newAnnotationName, value: newAnnotationValue });
    setNewAnnotationName('');
    setNewAnnotationValue('');
  }, [newAnnotationName, newAnnotationValue, createAnnotation]);

  return (
    <Modal title="分配注解" open={open} onCancel={onClose} onOk={handleOk} width={500}>
      <Space direction="vertical" className="w-full" size="middle">
        <div className="text-sm text-gray-500 mb-2">创建新注解</div>
        <Space.Compact className="w-full">
          <Input
            placeholder="注解名称 (如: server/env)"
            value={newAnnotationName}
            onChange={(e) => setNewAnnotationName(e.target.value)}
            style={{ width: '50%' }}
          />
          <Input
            placeholder="注解值 (如: prod)"
            value={newAnnotationValue}
            onChange={(e) => setNewAnnotationValue(e.target.value)}
            onPressEnter={handleCreateAnnotation}
            style={{ width: '35%' }}
          />
          <Button 
            icon={<PlusOutlined />} 
            onClick={handleCreateAnnotation} 
            disabled={!newAnnotationName || !newAnnotationValue}
            style={{ width: '15%' }}
          >
            创建
          </Button>
        </Space.Compact>
        
        <div className="text-sm text-gray-500 mb-2">选择现有注解</div>
        <Select
          mode="multiple"
          className="w-full"
          placeholder="选择注解"
          value={annotationAssign.selectedAnnotations}
          onChange={(values) => setAnnotationAssign({ selectedAnnotations: values })}
          options={options}
          showSearch
          optionFilterProp="label"
          listHeight={300}
        />
      </Space>
    </Modal>
  );
}
