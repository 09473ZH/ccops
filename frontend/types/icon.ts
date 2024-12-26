// 文件图标映射
const FileIconMap = {
  md: 'catppuccin:markdown',
  py: 'catppuccin:python',
  js: 'catppuccin:javascript',
  sh: 'catppuccin:powershell',
  json: 'catppuccin:json',
  yaml: 'catppuccin:yaml',
  yml: 'catppuccin:yaml',
  xml: 'catppuccin:xml',
  txt: 'catppuccin:text',
  sql: 'catppuccin:database',
  default: 'catppuccin:file',
} as const;

// 操作系统图标映射
const OsIconMap = {
  ubuntu: 'logos:ubuntu',
  centos: 'logos:centos-icon',
  debian: 'logos:debian',
  fedora: 'logos:fedora',
  arch: 'logos:archlinux',
  win: 'logos:microsoft-windows-icon',
  mac: 'logos:apple',
  linux: 'logos:linux-tux',
  redhat: 'logos:redhat-icon',
  suse: 'logos:suse',
  mint: 'logos:linux-mint',
  manjaro: 'logos:manjaro',
} as const;

// 操作图标映射
const ActionIconMap = {
  view: 'flowbite:eye-outline',
  edit: 'flowbite:edit-outline',
  download: 'flowbite:download-outline',
  upload: 'flowbite:upload-outline',
  delete: 'flowbite:trash-bin-outline',
  tag: 'flowbite:tag-outline',
  cancel: 'flowbite:x-outline',
  save: 'flowbite:file-check-outline',
  terminal: 'flowbite:terminal-outline',
  unlock: 'flowbite:link-break-outline',
  active: 'flowbite:bell-ring-solid',
  inactive: 'flowbite:bell-outline',
  diff: 'codicon:diff',
  file: 'flowbite:file-lines-outline',
  replay: 'material-symbols:replay-rounded',
  host: 'material-symbols:host-outline',
} as const;

export const IconMap = {
  file: FileIconMap,
  os: OsIconMap,
  action: ActionIconMap,
} as const;

// 收集所有图标用于预加载
export const ALL_ICONS = [
  ...Object.values(FileIconMap),
  ...Object.values(OsIconMap),
  ...Object.values(ActionIconMap),
];

export type IconType = (typeof ALL_ICONS)[number];
