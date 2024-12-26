import { useQuery } from '@tanstack/react-query';
import { FormInstance } from 'antd';

import type { ConfigListResponse } from '@/api/services/configService';
import configService from '@/api/services/configService';
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage';
import type { ConfigGroup } from '@/types/config';
import { transformConfig } from '@/utils/configTransform';

import useSystemConfigStore from './useSystemConfigStore';

export function useSystemConfig(form: FormInstance<any>) {
  const { data, isLoading } = useQuery<ConfigListResponse, Error, ConfigGroup[]>({
    queryKey: ['configList'],
    queryFn: () => configService.getConfigList(),
    select: (data) => transformConfig(data.list),
  });

  const updateConfig = useMutationWithMessage({
    mutationFn: configService.updateConfig,
    successMsg: '更新配置成功',
    errMsg: '更新配置失败',
    invalidateKeys: ['configList'],
  });

  const transformFormValues = (values: Record<string, string>): Record<string, string> => {
    return Object.entries(values).reduce<Record<string, string>>((acc, [key, value]) => {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      const keyWithValue = camelKey.endsWith('Value') ? camelKey : `${camelKey}Value`;
      return { ...acc, [keyWithValue]: value };
    }, {});
  };

  const handleSave = async (values: Record<string, string>) => {
    return updateConfig(transformFormValues(values));
  };

  const saveConfig = async (fieldNames: string[], loadingKey: 'saveAll' | 'saveGroup') => {
    const { setLoadingState } = useSystemConfigStore.getState();
    setLoadingState(loadingKey, true);
    try {
      const values = await form.validateFields(fieldNames);
      await handleSave(values);
    } finally {
      setLoadingState(loadingKey, false);
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

export { default as useSystemConfigStore } from './useSystemConfigStore';
