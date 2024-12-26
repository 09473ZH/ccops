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

const configService = {
  getConfigList: () => get<ConfigListResponse>('/api/configuration'),

  updateConfig: (params: UpdateConfigParams) => put(`/api/configuration`, params),
};

export default configService;
