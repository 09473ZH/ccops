import { useQuery } from '@tanstack/react-query';

import userService from '@/api/services/user';

import { UserInfo } from '#/entity';
/**
 * 获取用户信息的 Hook
 */
export function useUserInfo() {
  const { data, ...rest } = useQuery<UserInfo>({
    queryKey: ['userInfo'],
    queryFn: () => userService.getCurrentUser(),
    staleTime: 1000 * 60 * 5, // 5分钟
  });

  return {
    userInfo: data,
    ...rest,
  };
}
