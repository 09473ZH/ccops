export interface ConfigItem {
  key: string;
  value: string;
  description?: string;
  required?: boolean;
  type?: 'text' | 'password' | 'textarea';
}

export interface ConfigGroup {
  id: string;
  title: string;
  items: ConfigItem[];
  groupSave?: boolean;
}
