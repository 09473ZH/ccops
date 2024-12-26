import { useIcon } from '@/hooks/useIcon';

import { IconMap } from '#/icon';

function OsIcon({ osName }: { osName: string }) {
  const Icon = useIcon('');
  const normalizedOsName = osName.toLowerCase();
  const iconKey = Object.keys(IconMap.os).find((key) => normalizedOsName.includes(key));
  const iconName = iconKey ? IconMap.os[iconKey as keyof typeof IconMap.os] : '';

  return (
    <span className="inline-flex items-center gap-2">
      <Icon icon={iconName} className="h-5 w-5" />
      <span className="truncate">{osName || '--'}</span>
    </span>
  );
}

export default OsIcon;
