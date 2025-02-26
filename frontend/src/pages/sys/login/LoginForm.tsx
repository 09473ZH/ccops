/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, Form, Input } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SignInReq } from '@/api/services/user';
import { useUserInfo } from '@/hooks/use-user';
import { useSignIn } from '@/store/user';

// TODO 使用手机号登录
const { useLoginStateContext, LoginStateEnum } = await import('./providers/LoginStateProvider');

function LoginForm() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const { refresh } = useUserInfo();
  const { loginState, setLoginState } = useLoginStateContext();
  const signIn = useSignIn();

  if (loginState !== LoginStateEnum.LOGIN) return null;

  const handleFinish = async ({ username, password }: SignInReq) => {
    setLoading(true);
    try {
      signIn({ username, password });
      refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      name="login"
      size="large"
      layout="vertical"
      initialValues={{
        remember: true,
        username: 'admin',
        password: 'admin123',
      }}
      onFinish={handleFinish}
      className="w-full"
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: t('sys.login.accountPlaceholder') }]}
        className="mb-4"
      >
        <div className="relative">
          <div
            className={`absolute -top-5 left-0 text-xs text-gray-400 transition-opacity duration-200 ${
              showTip ? 'opacity-100' : 'opacity-0'
            }`}
          >
            支持用户名或邮箱登录
          </div>
          <Input
            placeholder={t('sys.login.userName')}
            className="bg-white/60 dark:bg-white/10 h-11 rounded-lg backdrop-blur-sm"
            onFocus={() => setShowTip(true)}
            onBlur={() => setShowTip(false)}
          />
        </div>
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: t('sys.login.passwordPlaceholder') }]}
        className="mb-6"
      >
        <Input.Password
          placeholder={t('sys.login.password')}
          className="bg-white/60 dark:bg-white/10 h-11 rounded-lg backdrop-blur-sm"
        />
      </Form.Item>
      {/* 
      <div className="mb-6 flex items-center justify-between">
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox className="text-gray-600 dark:text-gray-300">
            {t('sys.login.rememberMe')}
          </Checkbox>
        </Form.Item>
        <Button type="link" className="hover:!text-primary !px-0 text-gray-600 dark:text-gray-300">
          忘记密码？
        </Button>
      </div> */}

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          className="h-8 w-full rounded-lg text-base font-medium"
          loading={loading}
        >
          {t('sys.login.loginButton')}
        </Button>
      </Form.Item>
      {/* 
      <div className="flex items-center justify-center gap-1 text-gray-500"> */}
      {/* <span>还没有账号？</span> */}
      {/* <Button
          type="link"
          className="hover:!text-primary !px-1 !text-sm font-medium"
          onClick={() => setLoginState?.(LoginStateEnum.REGISTER)}
        >
          {t('sys.login.signUpFormTitle')}
        </Button> */}
      {/* </div> */}
    </Form>
  );
}

export default LoginForm;
