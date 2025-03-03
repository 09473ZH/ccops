import { useQuery, useQueryClient } from '@tanstack/react-query';

import userService from '@/api/services/user';
import useUserStore from '@/store/user';

import { UserInfo } from '#/entity';
/**
 * 获取用户信息的 Hook
 */
export function useUserInfo() {
  const { tokenInfo } = useUserStore();
  const queryClient = useQueryClient();

  const { data, ...rest } = useQuery<UserInfo>({
    queryKey: ['userInfo'],
    queryFn: () => userService.getCurrentUser(),
    staleTime: 1000 * 60 * 5, // 5分钟
    enabled: !!tokenInfo.accessToken,
  });

  const refresh = () => {
    return queryClient.invalidateQueries({ queryKey: ['userInfo'] });
  };

  return {
    userInfo: data,
    refresh,
    ...rest,
  };
}
