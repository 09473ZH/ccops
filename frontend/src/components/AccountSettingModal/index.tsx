import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Button, Form, Input, Spin, Tabs, Modal } from 'antd';
import React, { useEffect } from 'react';
import { toast } from 'sonner';

import userService from '@/api/services/user';
import { useUserInfo } from '@/hooks/use-user';

interface UserInfoForm {
  username: string;
  email: string;
  role: string;
}

interface ResetPasswordForm {
  oldPassword: string;
  password: string;
  confirmPassword: string;
}

const PASSWORD_RULES = {
  minLength: 8,
  pattern: /^(?=.*[a-zA-Z])(?=.*[0-9]).*$/,
};

const FORM_RULES = {
  password: [
    { required: true, message: '请输入新密码' },
    { min: PASSWORD_RULES.minLength, message: `密码长度至少为${PASSWORD_RULES.minLength}个字符` },
    { pattern: PASSWORD_RULES.pattern, message: '密码必须同时包含数字和字母' },
  ],
};

function ProfileForm({ form, isLoading }: { form: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <div className="space-y-4">
        <Form.Item label="用户名" name="username">
          <Input disabled className="rounded-md" />
        </Form.Item>

        <Form.Item label="邮箱" name="email">
          <Input disabled className="rounded-md" />
        </Form.Item>

        <Form.Item label="角色" name="role">
          <Input disabled className="rounded-md" />
        </Form.Item>
      </div>
    </Form>
  );
}

export function PasswordForm({
  onlyReset = false,
  form,
  onFinish,
  isLoading = false,
}: {
  form: any;
  onFinish: (values: ResetPasswordForm) => void;
  isLoading?: boolean;
  onlyReset?: boolean;
}) {
  const preventCopyPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} className="space-y-4">
      {!onlyReset && (
        <Form.Item
          label="当前密码"
          name="oldPassword"
          rules={[{ required: true, message: '请输入当前密码' }]}
        >
          <Input.Password
            placeholder="输入当前密码"
            className="rounded-md"
            onCopy={preventCopyPaste}
            onPaste={preventCopyPaste}
            onCut={preventCopyPaste}
            autoComplete="off"
          />
        </Form.Item>
      )}

      <Form.Item label="新密码" name="password" rules={FORM_RULES.password}>
        <Input.Password
          placeholder="输入新密码"
          className="rounded-md"
          onCopy={preventCopyPaste}
          onPaste={preventCopyPaste}
          onCut={preventCopyPaste}
          autoComplete="off"
        />
      </Form.Item>

      {!onlyReset && (
        <Form.Item
          label="确认新密码"
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: '请再次输入新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的新密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password
            placeholder="再次输入新密码"
            className="rounded-md"
            onCopy={preventCopyPaste}
            onPaste={preventCopyPaste}
            onCut={preventCopyPaste}
            autoComplete="off"
          />
        </Form.Item>
      )}

      <div className="mt-6">
        <p className="mb-4 text-sm text-gray-500">
          密码长度至少为 8 个字符, 且必须同时包含数字和字母
        </p>
        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          className="w-full"
          size="large"
          id="submit-password-change"
        >
          更新密码
        </Button>
      </div>
    </Form>
  );
}

interface AccountManageModalProps {
  open: boolean;
  onClose: () => void;
}

function AccountManageModal({ open, onClose }: AccountManageModalProps) {
  const { userInfo, isLoading } = useUserInfo();
  const [userForm] = Form.useForm<UserInfoForm>();
  const [passwordForm] = Form.useForm<ResetPasswordForm>();

  // 重置表单
  const handleClose = () => {
    userForm.resetFields();
    passwordForm.resetFields();
    onClose();
  };

  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordForm) => userService.resetMyPassword(data),
    onSuccess: () => {
      toast.success('密码重置成功');
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // 当用户信息变化时更新表单
  useEffect(() => {
    if (open && userInfo) {
      userForm.setFieldsValue({
        username: userInfo.username,
        email: userInfo.email,
        role: userInfo.role,
      });
    }
  }, [userInfo, userForm, open]);

  const items = [
    {
      key: 'profile',
      label: (
        <span className="flex items-center gap-2 px-2">
          <UserOutlined />
          个人信息
        </span>
      ),
      children: (
        <div className="px-2">
          <ProfileForm form={userForm} isLoading={isLoading} />
        </div>
      ),
    },
    {
      key: 'password',
      label: (
        <span className="flex items-center gap-2 px-2">
          <LockOutlined />
          修改密码
        </span>
      ),
      children: (
        <div className="px-2">
          <PasswordForm
            form={passwordForm}
            onFinish={resetPasswordMutation.mutate}
            isLoading={resetPasswordMutation.isPending}
          />
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="账户设置"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={650}
      destroyOnClose
    >
      <Tabs defaultActiveKey="profile" items={items} tabPosition="left" className="min-h-[350px]" />
    </Modal>
  );
}

export default AccountManageModal;
