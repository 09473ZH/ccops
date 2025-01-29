import { get, put } from '../apiClient';

export interface ConfigItem {
  id: number;
  createdAt: string;
  updatedAt: string;
  type: string;
  fieldName: string;
  fieldValue: string;
  fieldDescription: string;
  isChanged: boolean;
}

export interface ConfigListResponse {
  count: number;
  list: ConfigItem[];
}

export interface UpdateConfigParams {
  [key: string]: string;
}

export interface GroupedConfig {
  [type: string]: ConfigItem[];
}

export interface ConfigStructure {
  [type: string]: {
    fieldNames: string[];
    descriptions: { [fieldName: string]: string };
  };
}

const configService = {
  getConfigList: () => get<ConfigListResponse>('/api/configuration'),

  getGroupedConfigList: async (): Promise<GroupedConfig> => {
    const response = await configService.getConfigList();
    return response.list.reduce((acc: GroupedConfig, item: ConfigItem) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    }, {});
  },

  getConfigValue: async (type: string, fieldName: string): Promise<string | undefined> => {
    const response = await configService.getConfigValueByType(type);
    const configItem = response.list.find((item) => item.fieldName === fieldName);
    return configItem?.fieldValue;
  },

  getConfigValueByType: (type: string) =>
    get<ConfigListResponse>(`/api/configuration?type=${type}`),

  getConfigStructure: async (): Promise<ConfigStructure> => {
    const groupedConfig = await configService.getGroupedConfigList();
    return Object.entries(groupedConfig).reduce((acc: ConfigStructure, [type, items]) => {
      acc[type] = {
        fieldNames: items.map((item) => item.fieldName),
        descriptions: items.reduce(
          (desc, item) => ({
            ...desc,
            [item.fieldName]: item.fieldDescription,
          }),
          {},
        ),
      };
      return acc;
    }, {});
  },

  updateConfig: (params: UpdateConfigParams) => put(`/api/configuration`, params),
};

export default configService;
