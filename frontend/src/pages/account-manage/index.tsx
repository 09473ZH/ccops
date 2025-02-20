import { useMutation } from '@tanstack/react-query';
import { Button, Form, Input, Tabs, Descriptions, Spin } from 'antd';
import { toast } from 'sonner';

import userService from '@/api/services/user';
import { useUserInfo } from '@/hooks/useUser';

import type { DescriptionsProps } from 'antd';

interface ResetPasswordForm {
  oldPassword: string;
  password: string;
  confirmPassword: string;
}

function AccountManage() {
  const [form] = Form.useForm<ResetPasswordForm>();
  const { userInfo, isLoading } = useUserInfo();
  const { username = '-', email = '-', role = '-', isEnabled = false } = userInfo ?? {};
  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordForm) => userService.resetMyPassword(data),
    onSuccess: () => {
      toast.success('密码重置成功');
      form.resetFields();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const preventCopyPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  const userInfoItems: DescriptionsProps['items'] = [
    {
      key: 'username',
      label: '用户名',
      children: username,
      span: 1,
    },
    {
      key: 'role',
      label: '角色',
      children: role,
      span: 1,
    },
    {
      key: 'email',
      label: '邮箱',
      children: email,
      span: 1,
    },
    {
      key: 'status',
      label: '账户状态',
      children: (
        <span className={isEnabled ? 'text-green-600' : 'text-red-600'}>
          {isEnabled ? '已启用' : '已禁用'}
        </span>
      ),
      span: 1,
    },
  ];

  const items = [
    {
      key: 'info',
      label: '基本信息',
      children: isLoading ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : (
        <Descriptions items={userInfoItems} column={{ xs: 1, sm: 2 }} size="default" />
      ),
    },
    {
      key: 'password',
      label: '重置密码',
      children: (
        <div className="bg-white rounded-lg p-6">
          <div className="mx-auto max-w-[480px]">
            <div className="mb-8 text-center">
              <h2 className="text-center text-xl font-semibold text-gray-900">设置新密码</h2>
              <p className="mt-2 text-sm text-gray-600">
                密码长度至少为6个字符, 且只能包含数字和小写字母
              </p>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={resetPasswordMutation.mutate}
              className="space-y-6"
            >
              <Form.Item
                label="当前密码"
                name="oldPassword"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password
                  placeholder="请输入当前密码"
                  size="large"
                  onCopy={preventCopyPaste}
                  onPaste={preventCopyPaste}
                  onCut={preventCopyPaste}
                />
              </Form.Item>

              <Form.Item
                label="新密码"
                name="password"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 8, message: '密码长度至少为6个字符, 且只能包含数字和小写字母' },
                ]}
              >
                <Input.Password
                  placeholder="请输入新密码"
                  size="large"
                  onCopy={preventCopyPaste}
                  onPaste={preventCopyPaste}
                  onCut={preventCopyPaste}
                />
              </Form.Item>

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
                  placeholder="请再次输入新密码"
                  size="large"
                  onCopy={preventCopyPaste}
                  onPaste={preventCopyPaste}
                  onCut={preventCopyPaste}
                />
              </Form.Item>

              <Form.Item className="mb-0 mt-8">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={resetPasswordMutation.isPending}
                  block
                  size="large"
                  className="h-11"
                >
                  重置
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4">
        <Tabs defaultActiveKey="info" items={items} />
      </div>
    </div>
  );
}
export default AccountManage;
