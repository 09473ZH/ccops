/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMutation } from '@tanstack/react-query';
import { Button } from 'antd';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { SignInReq } from '@/api/services/user';
import { Iconify } from '@/components/Icon';
import { useUserInfo } from '@/hooks/use-user';
import { useSignIn } from '@/store/user';

function LoginForm() {
  const { t } = useTranslation();
  const { refresh } = useUserInfo();
  const signIn = useSignIn();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInReq>({
    defaultValues: {
      username: 'admin',
      password: 'admin',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: SignInReq) => {
      return signIn(data);
    },
    onSuccess: () => {
      refresh();
    },
  });

  const onSubmit = handleSubmit((data: SignInReq) => {
    loginMutation.mutate(data);
  });

  return (
    <form onSubmit={onSubmit} className="w-full" autoComplete="on">
      <div className="relative mb-4">
        <input
          type="text"
          autoComplete="username"
          placeholder=" "
          className="peer h-11 w-full rounded-lg border border-gray-500 bg-white px-3 py-2 text-black outline-none focus:border-2 data-[error=true]:border-red-500 [&:-webkit-autofill:focus]:!bg-white [&:-webkit-autofill:hover]:!bg-white [&:-webkit-autofill]:!bg-white [&:-webkit-autofill]:!bg-clip-text [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]"
          data-error={!!errors.username}
          {...register('username', {
            required: t('sys.login.accountPlaceholder'),
          })}
        />
        <div className="peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:text-blue-600 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-white px-1 text-gray-500 transition-all duration-200 ease-out peer-focus:left-2 peer-focus:top-[-8px] peer-focus:translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:left-2 peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-data-[error=true]:left-2 peer-data-[error=true]:top-[-8px] peer-data-[error=true]:translate-y-0 peer-data-[error=true]:text-xs peer-data-[error=true]:text-red-500">
          {t('sys.login.account')}
        </div>
        {errors.username && (
          <div className="mt-1 flex h-6 items-center text-sm text-red-500">
            <Iconify icon="mdi:alert-circle" className="mr-1 h-4 w-4" />
            {errors.username.message}
          </div>
        )}
      </div>

      <div className="relative mb-2">
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder=" "
            className="peer h-11 w-full rounded-lg border border-gray-500 bg-white px-3 py-2 pr-10 text-black outline-none focus:border-2 data-[error=true]:border-red-500 [&:-webkit-autofill:focus]:!bg-white [&:-webkit-autofill:hover]:!bg-white [&:-webkit-autofill]:!bg-white [&:-webkit-autofill]:!bg-clip-text [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]"
            data-error={!!errors.password}
            {...register('password', {
              required: t('sys.login.passwordPlaceholder'),
            })}
          />
          <div className="peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:text-blue-600 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-white px-1 text-gray-500 transition-all duration-200 ease-out peer-focus:left-2 peer-focus:top-[-8px] peer-focus:translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:left-2 peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-data-[error=true]:left-2 peer-data-[error=true]:top-[-8px] peer-data-[error=true]:translate-y-0 peer-data-[error=true]:text-xs peer-data-[error=true]:text-red-500">
            {t('sys.login.password')}
          </div>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <Iconify icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} className="h-5 w-5" />
          </button>
        </div>
        {errors.password && (
          <div className="mt-1 flex h-6 items-center text-sm text-red-500">
            <Iconify icon="mdi:alert-circle" className="mr-1 h-4 w-4" />
            {errors.password.message}
          </div>
        )}
      </div>
      <Button type="primary" htmlType="submit" loading={loginMutation.isPending} block size="large">
        {t('sys.login.loginButton')}
      </Button>
    </form>
  );
}

export default LoginForm;
