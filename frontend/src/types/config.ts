export interface ConfigItem {
  key: string;
  value: string;
  description?: string;
  required?: boolean;
  type?: 'text' | 'password' | 'textarea';
  /** Sensitive fields (SSH private key, API tokens) whose backend value is
   * masked on read. UI should show a placeholder hint and skip the field
   * on save unless the user typed a replacement. */
  sensitive?: boolean;
}

export interface ConfigGroup {
  id: string;
  title: string;
  items: ConfigItem[];
  groupSave?: boolean;
}
