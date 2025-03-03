import { BasicStatus, PermissionType } from './enum';

export interface UserToken {
  accessToken: string;
  refreshToken: string;
  expireAt: number;
}

export interface UserInfo {
  id: number;
  username: string;
  role: string;
  email: string;
  isEnabled: boolean;
  isInit: boolean;
  password?: string;
  avatar?: string;
  permissions: {
    hostIds: number[];
    labelIds: number[];
  };
}

export interface Organization {
  id: string;
  name: string;
  status: 'enable' | 'disable';
  desc?: string;
  order?: number;
  children?: Organization[];
}

export interface Permission {
  id: string;
  parentId: string;
  name: string;
  label: string;
  type: PermissionType;
  route: string;
  status?: BasicStatus;
  order?: number;
  icon?: string;
  component?: string;
  hide?: boolean;
  hideTab?: boolean;
  frameSrc?: string;
  newFeature?: boolean;
  children?: Permission[];
}

export interface Role {
  id: string;
  name: string;
  label: string;
  status: BasicStatus;
  order?: number;
  desc?: string;
  permission?: Permission[];
}
