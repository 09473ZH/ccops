import { Form, Input, Button, Modal, Select } from 'antd';

import { RoleItem } from '@/api/services/software';
import { Iconify } from '@/components/Icon';
import { useModalsControl } from '@/hooks/use-modals-control';

import { SoftwareTable } from './Table';
import { useRoleOperations, useSoftwareStore } from './use-software';

function SoftwareManage() {
  const [addForm] = Form.useForm();
  const { createRole, updateRole } = useRoleOperations();
  const { open, close, isOpen } = useModalsControl({ modals: ['addSoftware', 'assignLabel'] });

  const { selectedLabels, editingSoftwareId, actions } = useSoftwareStore();

  const handleAssignLabel = (record: RoleItem) => {
    actions.setSelectedLabels(record.tags || []);
    actions.setEditingSoftwareId(record.id);
    open('assignLabel');
  };

  const handleSubmitAssignLabel = () => {
    if (editingSoftwareId) {
      updateRole.mutate({
        id: editingSoftwareId,
        data: { tags: selectedLabels },
      });
      close('assignLabel');
    }
  };

  return (
    <div className="flex h-full flex-col p-5">
      <div>
        <Button
          type="primary"
          icon={<Iconify icon="flowbite:plus-outline" />}
          onClick={() => open('addSoftware')}
          className="float-right mb-4"
        >
          添加软件
        </Button>
      </div>
      <SoftwareTable onAssignLabel={handleAssignLabel} />

      <Modal
        title="添加新软件"
        open={isOpen('addSoftware')}
        onOk={() => {
          addForm.validateFields().then((values) => {
            createRole.mutateAsync(values).then(() => {
              close('addSoftware');
              addForm.resetFields();
            });
          });
        }}
        onCancel={() => close('addSoftware')}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item name="name" label="软件名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="软件描述" rules={[{ required: true }]}>
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分配标签"
        open={isOpen('assignLabel')}
        onCancel={() => close('assignLabel')}
        onOk={handleSubmitAssignLabel}
      >
        <Select
          mode="tags"
          style={{ width: '100%' }}
          placeholder="选择标签"
          value={selectedLabels}
          onChange={(value) => actions.setSelectedLabels(value)}
          allowClear
          options={[]}
        />
      </Modal>
    </div>
  );
}

export default SoftwareManage;
