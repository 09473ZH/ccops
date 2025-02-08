import { Table, Form, FormInstance, Input } from 'antd';

import type { ColumnType, ColumnsType } from 'antd/es/table';

// 扩展列的类型，添加 editable 属性
export interface EditableColumn<T> extends ColumnType<T> {
  editable?: boolean;
}

interface EditableCellProps {
  editing: boolean;
  dataIndex: string;
  title: string;
  inputType?: 'text' | 'textarea';
  record: any;
  index: number;
  children: React.ReactNode;
}

function EditableCell({
  editing,
  dataIndex,
  title,
  inputType = 'text',
  children,
  ...restProps
}: EditableCellProps) {
  const inputNode = inputType === 'textarea' ? <Input.TextArea /> : <Input />;

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: true,
              message: `请输入${title}`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
}

interface EditableTableProps<T> {
  dataSource?: T[];
  columns: EditableColumn<T>[];
  form: FormInstance;
  isEditing: (record: T) => boolean;
  renderActions: (record: T, editable: boolean) => React.ReactNode;
  loading?: boolean;
}

function EditableTable<T extends { id: number }>({
  dataSource,
  columns,
  form,
  isEditing,
  renderActions,
  loading,
}: EditableTableProps<T>) {
  const mergedColumns: ColumnsType<T> = [
    ...columns.map((col) => {
      if (!col.editable) {
        return col;
      }

      return {
        ...col,
        onCell: (record: T) => ({
          record,
          dataIndex: col.dataIndex as string,
          title: col.title as string,
          editing: isEditing(record),
          inputType: col.dataIndex === 'description' ? 'textarea' : 'text',
        }),
      };
    }),
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => renderActions(record, isEditing(record)),
    },
  ];

  return (
    <Form form={form} component={false}>
      <Table
        components={{
          body: {
            cell: EditableCell as any,
          },
        }}
        dataSource={dataSource}
        columns={mergedColumns}
        rowKey="id"
        loading={loading}
      />
    </Form>
  );
}

export default EditableTable;
