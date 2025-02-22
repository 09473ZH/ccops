import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Button, Form, Input, Spin } from 'antd';
import React, { useEffect } from 'react';
import { toast } from 'sonner';

import userService from '@/api/services/user';
import { useUserInfo } from '@/hooks/useUser';

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
  minLength: 6,
  pattern: /^[a-z0-9]+$/,
};

const FORM_RULES = {
  password: [
    { required: true, message: '请输入新密码' },
    { min: PASSWORD_RULES.minLength, message: `密码长度至少为${PASSWORD_RULES.minLength}个字符` },
    { pattern: PASSWORD_RULES.pattern, message: '密码只能包含数字和小写字母' },
  ],
};

function AccountManage() {
  const [userForm] = Form.useForm<UserInfoForm>();
  const [passwordForm] = Form.useForm<ResetPasswordForm>();
  const { userInfo, isLoading } = useUserInfo();
  const [showPasswordForm, setShowPasswordForm] = React.useState(false);

  useEffect(() => {
    if (userInfo) {
      userForm.setFieldsValue({
        username: userInfo.username,
        email: userInfo.email,
        role: userInfo.role,
      });
    }
  }, [userInfo, userForm]);

  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordForm) => userService.resetMyPassword(data),
    onSuccess: () => {
      toast.success('密码重置成功');
      passwordForm.resetFields();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const preventCopyPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  return (
    <div className="bg-white p-5">
      <div className="container max-w-[720px]">
        <div className="space-y-3">
          {/* 用户信息部分 */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-normal text-gray-900 dark:text-gray-300">
              <UserOutlined className="text-gray-600 dark:text-gray-300" />
              Profile
            </h2>
            {isLoading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <Spin size="large" tip="Loading..." />
              </div>
            ) : (
              <Form form={userForm} layout="vertical">
                <div className="space-y-3">
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
            )}
          </div>

          {/* 密码部分 */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-normal text-gray-900 dark:text-gray-300">
              <LockOutlined className="text-gray-600 dark:text-gray-300" />
              Password
            </h2>
            <Button
              type="default"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              id="change-password-toggle"
              size="middle"
              className="flex items-center gap-1"
            >
              {showPasswordForm ? '隐藏' : '修改密码'}
            </Button>
          </div>

          <div
            className={`transition-all duration-300 ${showPasswordForm ? 'block' : 'hidden'}`}
            id="password-form-section"
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={resetPasswordMutation.mutate}
              className="space-y-3"
            >
              <Form.Item
                label={<span className="text-gray-700">当前密码</span>}
                name="oldPassword"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password
                  placeholder="输入当前密码"
                  className="rounded-md"
                  onCopy={preventCopyPaste}
                  onPaste={preventCopyPaste}
                  onCut={preventCopyPaste}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-gray-700">新密码</span>}
                name="password"
                rules={FORM_RULES.password}
              >
                <Input.Password
                  placeholder="输入新密码"
                  className="rounded-md"
                  onCopy={preventCopyPaste}
                  onPaste={preventCopyPaste}
                  onCut={preventCopyPaste}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-gray-700">确认新密码</span>}
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
                />
              </Form.Item>

              <div className="mt-3">
                <p className="mb-3 text-sm text-gray-500">
                  密码长度至少为6个字符, 且只能包含数字和小写字母
                </p>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={resetPasswordMutation.isPending}
                  className="px-4"
                  size="middle"
                  id="submit-password-change"
                >
                  更新密码
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountManage;
