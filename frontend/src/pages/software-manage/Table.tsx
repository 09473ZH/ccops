import { Space, Popconfirm, Button, Form } from 'antd';
import { useNavigate } from 'react-router-dom';

import { RoleItem } from '@/api/services/software';
import { ActionButton } from '@/components/Button';
import ShowMoreTags from '@/components/ShowMoreTags';
import ShowTooltip from '@/components/ShowTooltip';
import EditableTable, { EditableColumn } from '@/components/Table/EditableTable';
import ProTag from '@/theme/antd/components/Tag';
import { formatTimeAgo, formatDateTime } from '@/utils/format-time';

import { useRoleList, useRoleOperations, useSoftwareStore } from './use-software';

interface SoftwareTableProps {
  onAssignLabel?: (record: RoleItem) => void;
}

export function SoftwareTable({ onAssignLabel }: SoftwareTableProps) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { data: roleList, isLoading } = useRoleList();
  const { updateRole, deleteRole } = useRoleOperations();
  const { editingId, actions } = useSoftwareStore();

  const isEditing = (record: RoleItem) => record.id === editingId;

  const handleEdit = (record: RoleItem) => {
    form.setFieldsValue({ ...record });
    actions.startEdit(record.id, 'name');
  };

  const handleSave = async (id: number) => {
    const row = await form.validateFields();
    updateRole.mutate({ id, data: row });
    actions.cancelEdit();
  };

  const columns: EditableColumn<RoleItem>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      editable: true,
      render: (text: string, record: RoleItem) => (
        <Button type="link" onClick={() => navigate(`publish_config/${record.id}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      editable: true,
      width: 150,
      render: (text: string) => <ShowTooltip content={text} maxWidth={150} />,
    },
    {
      title: '存在激活版本',
      dataIndex: 'existActiveRevision',
      render: (existActiveRevision: boolean) => (
        <ProTag color={existActiveRevision ? 'green' : 'red'}>
          {existActiveRevision ? '是' : '否'}
        </ProTag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (text: string) => (
        <ShowTooltip
          content={formatTimeAgo(text)}
          tooltipContent={formatDateTime(text)}
          maxWidth={100}
          placement="topLeft"
        />
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <ShowMoreTags
          dataSource={(tags || []).map((tag) => ({ id: tag, name: tag }))}
          labelField="name"
          color="blue"
        />
      ),
    },
  ];

  return (
    <EditableTable
      dataSource={roleList?.list || []}
      columns={columns}
      form={form}
      isEditing={isEditing}
      renderActions={(record, editable) =>
        editable ? (
          <Space>
            <ActionButton icon="save" onClick={() => handleSave(record.id)} type="text" />
            <ActionButton icon="cancel" onClick={() => actions.cancelEdit()} type="text" />
          </Space>
        ) : (
          <Space>
            <ActionButton icon="edit" onClick={() => handleEdit(record)} type="text" />
            <ActionButton icon="tag" onClick={() => onAssignLabel?.(record)} type="text" />
            <Popconfirm
              title="确定要删除这个软件吗？"
              onConfirm={() => deleteRole.mutate(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <ActionButton icon="delete" type="text" danger />
            </Popconfirm>
          </Space>
        )
      }
      loading={isLoading}
    />
  );
}
