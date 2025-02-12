import { Modal, Select, Input, Divider, Button } from 'antd';
import isEqual from 'lodash/isEqual';
import { useState, useCallback, useRef, memo } from 'react';

import { useHostState, useLabelManagement } from '@/pages/host-manage/hooks';

import type { InputRef } from 'antd';

interface DropdownContentProps {
  menu: React.ReactElement;
  newLabelName: string;
  inputRef: React.RefObject<InputRef>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onCreateLabel: (e: React.MouseEvent) => void;
}

const DropdownContent = memo(function DropdownContent({
  menu,
  newLabelName,
  inputRef,
  onInputChange,
  onKeyDown,
  onCreateLabel,
}: DropdownContentProps) {
  return (
    <div className="w-full" onClick={(e) => e.stopPropagation()}>
      {menu}
      <Divider className="my-2" />
      <div className="px-2 pb-1">
        <div className="flex w-full gap-2">
          <Input
            className="flex-1"
            placeholder="请输入标签名称"
            ref={inputRef}
            value={newLabelName}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onCreateLabel(e);
            }}
            className="hover:bg-blue-50 hover:text-blue-500 transition-colors"
          >
            新建
          </Button>
        </div>
      </div>
    </div>
  );
});

export function AssignLabelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [newLabelName, setNewLabelName] = useState('');
  const inputRef = useRef<InputRef>(null);
  const { labelAssign, setLabelAssign } = useHostState();

  const {
    hostList,
    options,
    operations: { createLabel, assignLabel },
  } = useLabelManagement();

  const handleOk = async () => {
    if (!labelAssign.hostId) return;
    const currentLabelIds =
      hostList
        .find((h: { id: number | null }) => h.id === labelAssign.hostId)
        ?.label?.map((l: { id: number | null }) => l.id) || [];
    if (isEqual(new Set(currentLabelIds), new Set(labelAssign.selectedLabels))) {
      onClose();
      return;
    }
    assignLabel.mutate({
      hostId: labelAssign.hostId,
      labelIds: labelAssign.selectedLabels,
    });
    onClose();
  };

  const handleCreateLabel = useCallback(async () => {
    if (!newLabelName) return;
    createLabel.mutate(newLabelName);
    setNewLabelName('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [newLabelName, createLabel]);

  const renderDropdown = useCallback(
    (menu: React.ReactElement) => (
      <DropdownContent
        menu={menu}
        newLabelName={newLabelName}
        inputRef={inputRef}
        onInputChange={(e) => setNewLabelName(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            handleCreateLabel();
          }
        }}
        onCreateLabel={(e) => {
          e.preventDefault();
          handleCreateLabel();
        }}
      />
    ),
    [newLabelName, handleCreateLabel],
  );

  return (
    <Modal
      title="分配标签"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      className="min-w-[500px]"
    >
      <Select
        mode="multiple"
        className="w-full"
        placeholder="请选择标签"
        value={labelAssign.selectedLabels}
        onChange={(values) => setLabelAssign({ selectedLabels: values })}
        options={options}
        allowClear
        showSearch
        optionFilterProp="label"
        dropdownRender={renderDropdown}
        popupClassName="rounded-lg shadow-lg"
      />
    </Modal>
  );
}
