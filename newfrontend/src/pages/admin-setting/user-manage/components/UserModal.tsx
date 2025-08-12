import { Divider, Form, Input, Modal, Select } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useHostOptions,
  useLabelOptions,
  useAllSelect,
  ALL_OPTION_VALUE,
} from '@/hooks/use-common-options';

import { UserInfo } from '#/entity';

interface UserModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  record: UserInfo;
  onCancel: () => void;
  onOk: (values: {
    userId?: string;
    username: string;
    email: string;
    role: string;
    permissions: {
      hostIds: number[];
      labelIds: number[];
    };
  }) => void;
}

// 添加表单值类型定义
interface UserFormValues {
  username: string;
  email: string;
  role: 'user' | 'admin';
  permissions: {
    hostIds: number[];
    labelIds: number[];
  };
}

export default function UserModal({ open, mode, onOk, record, onCancel }: UserModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const hostOptions = useHostOptions();
  const labelOptions = useLabelOptions();

  const hostSelect = useAllSelect({
    options: hostOptions,
    values: record?.permissions?.hostIds || [],
  });

  const labelSelect = useAllSelect({
    options: labelOptions,
    values: record?.permissions?.labelIds || [],
  });

  useEffect(() => {
    if (open && record) {
      form.setFieldsValue({
        username: record.username,
        email: record.email,
        role: record.role,
        permissions: {
          // initialValue 用于处理"全部"选项的特殊逻辑
          hostIds: hostSelect.initialValue,
          labelIds: labelSelect.initialValue,
        },
      });
    }
  }, [open, form, record, hostSelect.initialValue, labelSelect.initialValue]);

  useEffect(() => {
    if (open && mode === 'create') {
      form.setFieldsValue({
        role: 'user',
        permissions: {
          hostIds: [],
          labelIds: [],
        },
      });
    }
  }, [open, mode, form]);

  const handleSubmit = async (values: UserFormValues) => {
    const finalValues = {
      ...values,
      permissions: {
        ...values.permissions,
        hostIds: hostSelect.getFinalValue(values.permissions.hostIds),
        labelIds: labelSelect.getFinalValue(values.permissions.labelIds),
      },
    };
    await onOk(finalValues);
  };

  const handleRoleChange = (role: string) => {
    if (mode === 'create') {
      if (role === 'admin') {
        // 如果是管理员，自动选择所有权限
        form.setFieldsValue({
          permissions: {
            hostIds: [ALL_OPTION_VALUE],
            labelIds: [ALL_OPTION_VALUE],
          },
        });
      } else {
        // 如果是普通用户，清空权限
        form.setFieldsValue({
          permissions: {
            hostIds: [],
            labelIds: [],
          },
        });
      }
    }
  };
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // 将角色选项移到组件内部
  const ROLE_OPTIONS = [
    { label: t('user.roleUser'), value: 'user' },
    { label: t('user.roleAdmin'), value: 'admin' },
  ] as const;

  return (
    <Modal
      title={mode === 'create' ? t('user.createUser') : t('user.editUser')}
      open={open}
      onCancel={handleCancel}
      onOk={() => form.validateFields().then(handleSubmit)}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="username" label={t('user.username')} rules={[{ required: true }]}>
          <Input disabled={mode === 'edit'} />
        </Form.Item>

        <Form.Item
          name="email"
          label={t('user.email')}
          rules={[{ required: true }, { type: 'email' }]}
        >
          <Input disabled={mode === 'edit'} />
        </Form.Item>
        <Divider plain>{t('user.permissions')}</Divider>
        <Form.Item name="role" label={t('user.role')} rules={[{ required: true }]}>
          <Select
            options={ROLE_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            onChange={handleRoleChange}
          />
        </Form.Item>
        <Form.Item name={['permissions', 'hostIds']} label={t('user.hosts')}>
          <Select
            mode="multiple"
            options={[{ value: ALL_OPTION_VALUE, label: '全部' }, ...hostOptions]}
            onChange={(value) => hostSelect.handleChange(value as number[], form, 'hostIds')}
          />
        </Form.Item>
        <Form.Item name={['permissions', 'labelIds']} label={t('user.labels')}>
          <Select
            mode="multiple"
            options={[{ value: ALL_OPTION_VALUE, label: '全部' }, ...labelOptions]}
            onChange={(value) => labelSelect.handleChange(value as number[], form, 'labelIds')}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
