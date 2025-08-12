import type { ConfigGroup, ConfigItem } from '@/types/config';

interface BackendConfig {
  id: number;
  createdAt: string;
  updatedAt: string;
  type: string;
  fieldName: string;
  fieldValue: string;
  fieldDescription: string;
  isChanged: boolean;
}

/**
 * 将后端配置数据转换为前端所需的 ConfigGroup 格式
 */
export function transformConfig(backendConfigs: BackendConfig[]): ConfigGroup[] {
  // 按type分组
  const groupedByType = backendConfigs.reduce((acc, config) => {
    const { type } = config;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(config);
    return acc;
  }, {} as Record<string, BackendConfig[]>);

  // 转换为 ConfigGroup[] 格式
  const result = Object.entries(groupedByType).map(([type, configs]): ConfigGroup => {
    const items: ConfigItem[] = configs.map((config): ConfigItem => {
      const item = {
        id: config.id,
        key: config.fieldName,
        value: config.fieldValue,
        description: config.fieldDescription,
        type: (() => {
          const fieldNameLower = config.fieldName.toLowerCase();
          if (fieldNameLower.includes('apikey')) return 'password';
          if (fieldNameLower.includes('key')) return 'textarea';
          return 'text';
        })(),
        required: true,
        group: type,
      };
      return item as ConfigItem;
    });

    return {
      id: `${type}-config`,
      title: `${type}Config`,
      items,
      groupSave: true,
    };
  });

  return result;
}

// 使用示例：
// const configGroups = transformConfig(backendConfigs);
