import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FormInstance } from 'antd';
import { toast } from 'sonner';

import type { ConfigListResponse } from '@/api/services/config';
import configService from '@/api/services/config';
import type { ConfigGroup } from '@/types/config';
import { transformConfig } from '@/utils/config-transform';

import useSystemConfigStore from './use-system-config-store';

export function useSystemConfig(form: FormInstance<any>) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ConfigListResponse, Error, ConfigGroup[]>({
    queryKey: ['configList'],
    queryFn: () => configService.getConfigList(),
    select: (data) => transformConfig(data.list),
  });

  const updateConfig = useMutation({
    mutationFn: configService.batchUpdateConfig,
    onSuccess: () => {
      toast.success('更新配置成功');
      queryClient.invalidateQueries({ queryKey: ['configList'] });
    },
  });

  const transformFormValues = (values: Record<string, string>): Record<string, string> => {
    return Object.entries(values).reduce<Record<string, string>>((acc, [key, value]) => {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      const keyWithValue = camelKey.endsWith('Value') ? camelKey : `${camelKey}Value`;
      return { ...acc, [keyWithValue]: value };
    }, {});
  };

  const handleSave = async (values: Record<string, string>) => {
    return updateConfig.mutateAsync(transformFormValues(values));
  };

  const saveConfig = async (
    fieldNames: string[],
    loadingKey: 'saveAll' | 'saveGroup' | 'saveField',
  ) => {
    const { setLoadingState } = useSystemConfigStore.getState();
    if (loadingKey !== 'saveField') {
      setLoadingState(loadingKey, true);
    }
    try {
      const values = await form.validateFields(fieldNames);
      await handleSave(values);
    } catch (error) {
      if (error?.name === 'ValidationError') {
        toast.error('请检查表单填写是否正确');
      } else {
        toast.error(error instanceof Error ? error.message : '更新配置失败');
      }
    } finally {
      if (loadingKey !== 'saveField') {
        setLoadingState(loadingKey, false);
      }
    }
  };

  return {
    configList: data || [],
    isLoading,
    operations: {
      saveConfig,
    },
  };
}
