import { useMutation } from '@tanstack/react-query';
import { Modal, Form, Input, Button } from 'antd';
import { ReactNode } from 'react';
import { toast } from 'sonner';

import userService from '@/api/services/user';
import { useUserInfo } from '@/hooks/use-user';

/**
 * Blocks the entire app behind a modal when the logged-in user has not yet
 * completed the forced first-time password initialization (backend sets
 * IsInit=false on the seeded admin account). The user cannot dismiss the
 * modal — they must submit a new password before they can interact with
 * anything else.
 *
 * This exists because the backend now refuses to create the initial admin
 * with a known password; the operator instead picks up a random password
 * from the startup log (or sets CCOPS_INITIAL_ADMIN_PASSWORD). Forcing the
 * admin to replace that ephemeral password on first login means the logged
 * credential never stays valid any longer than the very first session.
 */
export default function ForceInitGuard({ children }: { children: ReactNode }) {
  const { userInfo, refresh } = useUserInfo();
  const [form] = Form.useForm<{ password: string; confirmPassword: string }>();

  const mutation = useMutation({
    mutationFn: userService.initializePassword,
    onSuccess: async () => {
      toast.success('密码已设置，请使用新密码登录');
      form.resetFields();
      await refresh();
    },
    onError: (err: Error) => {
      toast.error(err?.message || '设置失败');
    },
  });

  const needsInit = userInfo?.isInit === false;

  return (
    <>
      {children}
      <Modal
        open={needsInit}
        title="首次登录 — 请设置新密码"
        closable={false}
        maskClosable={false}
        keyboard={false}
        footer={null}
        destroyOnClose
      >
        <p className="mb-4 text-sm text-gray-500">
          系统检测到当前账号仍在使用初始密码，出于安全要求，请在继续使用前设置一个新密码。
        </p>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (values.password !== values.confirmPassword) {
              toast.error('两次输入的密码不一致');
              return;
            }
            mutation.mutate({
              password: values.password,
              confirmPassword: values.confirmPassword,
            });
          }}
        >
          <Form.Item
            label="新密码"
            name="password"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '至少 8 位' },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                message: '必须同时包含字母和数字',
              },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending} block>
            设置密码
          </Button>
        </Form>
      </Modal>
    </>
  );
}
