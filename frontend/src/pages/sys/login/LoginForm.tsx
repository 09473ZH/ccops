/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMutation } from '@tanstack/react-query';
import { Checkbox } from 'antd';
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
      password: 'admin123',
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
          className="focus:border-blue-600 peer h-11 w-full rounded-lg border border-gray-500 bg-orange-100 px-3 py-2 outline-none [-webkit-box-shadow:0_0_0_50px_rgb(255,237,213)_inset] placeholder:text-gray-500 placeholder:transition-all placeholder:duration-150 focus:border-2"
          {...register('username', {
            required: t('sys.login.accountPlaceholder'),
          })}
        />
        <div className="peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:text-blue-600 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-orange-100 px-1 text-gray-500 transition-all duration-200 ease-out peer-focus:left-2 peer-focus:top-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:left-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs">
          {t('sys.login.account')}
        </div>
        {errors.username && (
          <div className="mt-1 flex h-6 items-center text-sm text-[#dd4e4e]">
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
            className="focus:border-blue-600 peer h-11 w-full rounded-lg border border-gray-500 bg-orange-100 px-3 py-2 pr-10 outline-none [-webkit-box-shadow:0_0_0_50px_rgb(255,237,213)_inset] placeholder:text-gray-500 placeholder:transition-all placeholder:duration-150 focus:border-2"
            {...register('password', {
              required: t('sys.login.passwordPlaceholder'),
            })}
          />
          <div className="peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:text-blue-600 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-orange-100 px-1 text-gray-500 transition-all duration-200 ease-out peer-focus:left-2 peer-focus:top-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:left-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs">
            {t('sys.login.password')}
          </div>
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={loginMutation.isPending}
          >
            <Iconify icon="mdi:chevron-right" className="h-5 w-5" />
          </button>
        </div>
        {errors.password && (
          <div className="mt-1 flex h-6 items-center text-sm text-[#dd4e4e]">
            <Iconify icon="mdi:alert-circle" className="mr-1 h-4 w-4" />
            {errors.password.message}
          </div>
        )}
      </div>

      <Checkbox
        checked={showPassword}
        onChange={(e) => setShowPassword(e.target.checked)}
        className="text-sm text-gray-400 hover:text-gray-600"
      >
        {t('sys.login.showPassword')}
      </Checkbox>
    </form>
  );
}

export default LoginForm;
