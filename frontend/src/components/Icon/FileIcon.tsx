import { useIcon } from '@/hooks/use-icon';

import { IconMap } from '#/icon';

function FileIcon({ fileName }: { fileName: string }) {
  const Icon = useIcon(IconMap.file.default);
  const extension = (fileName && fileName.split('.').pop()?.toLowerCase()) || '';
  const iconName = IconMap.file[extension as keyof typeof IconMap.file] || IconMap.file.default;

  return (
    <span className="inline-flex items-center gap-2">
      <Icon icon={iconName} className="h-5 w-5" />
      <span className="truncate">{fileName?.trim() ? fileName : '--'}</span>
    </span>
  );
}

export default FileIcon;
