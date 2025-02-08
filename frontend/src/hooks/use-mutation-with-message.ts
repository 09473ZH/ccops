import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';

import type { UseMutationResult } from '@tanstack/react-query';

interface MutationConfig<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  successMsg?: string;
  errMsg?: string;
  invalidateKeys?: string[];
}

type MutationFunction<TData, TVariables> = {
  (variables: TVariables): Promise<TData | null>;
  isLoading: boolean;
  mutate: UseMutationResult<TData, Error, TVariables>['mutate'];
  mutateAsync: UseMutationResult<TData, Error, TVariables>['mutateAsync'];
};

export default function useMutationWithMessage<TData, TVariables>({
  mutationFn,
  successMsg,
  errMsg,
  invalidateKeys = [],
}: MutationConfig<TData, TVariables>) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const mutation = useMutation({
    mutationFn: async (variables: TVariables) => {
      try {
        const result = await mutationFn(variables);
        if (successMsg) {
          message.success(successMsg);
        }
        await Promise.all(
          invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
        );
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : errMsg || '操作失败';
        message.error(errorMessage);
        return null;
      }
    },
  });

  const enhancedMutate = Object.assign(
    async (variables: TVariables) => {
      const result = await mutation.mutateAsync(variables);
      return result;
    },
    {
      isLoading: mutation.isPending,
      mutate: mutation.mutate,
      mutateAsync: mutation.mutateAsync,
    },
  ) as MutationFunction<TData, TVariables>;

  return enhancedMutate;
}
