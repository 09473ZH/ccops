/* eslint-disable react/no-unstable-nested-components */
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import { Input, Checkbox } from 'antd';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useMyHosts } from '@/pages/host-manage/hooks';

import { Iconify } from '../Icon';

interface HostSelectorProps {
  defaultValue?: number[];
  onChange?: (value: number[]) => void;
  className?: string;
  style?: React.CSSProperties;
}

interface GroupItemProps {
  label: string;
  hosts: Array<{ id: number; name: string; ip: string }>;
  selectedHosts: Set<number>;
  onToggleHost: (hostId: number) => void;
  onToggleGroup: (hostIds: number[]) => void;
}

// 标签组组件
const GroupItem: React.FC<GroupItemProps> = function GroupItem({
  label,
  hosts,
  selectedHosts,
  onToggleHost,
  onToggleGroup,
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const allSelected = hosts.every((host) => selectedHosts.has(host.id));
  const someSelected = !allSelected && hosts.some((host) => selectedHosts.has(host.id));

  return (
    <div className="bg-gray-50/30 mb-1 rounded-lg p-1.5">
      <div className="hover:bg-white/80 flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1">
        <div
          className="flex flex-1 items-center gap-1.5"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <CaretDownOutlined className="text-gray-400" />
          ) : (
            <CaretRightOutlined className="text-gray-400" />
          )}
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={() => onToggleGroup(hosts.map((h) => h.id))}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
        </div>
        <span className="bg-blue-50 text-blue-600 rounded-full px-2 py-0.5 text-xs font-medium">
          {hosts.length} {t('台')}
        </span>
      </div>
      {isExpanded && (
        <div className="mt-0.5 space-y-0.5 pl-7">
          {hosts.map((host) => (
            <div
              key={host.id}
              className="hover:bg-white/80 flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1"
              onClick={() => onToggleHost(host.id)}
            >
              <Checkbox
                checked={selectedHosts.has(host.id)}
                onChange={() => onToggleHost(host.id)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="flex-1 truncate text-sm text-gray-700">{host.name}</span>
              <span className="min-w-[120px] text-sm text-gray-500">{host.ip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function HostSelector({
  defaultValue = [],
  onChange,
  className = '',
  style = {},
}: HostSelectorProps) {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const { list: myHosts } = useMyHosts();

  const [selectedHostIds, setSelectedHostIds] = useState<number[]>(defaultValue);
  const selectedHosts = useMemo(() => new Set(selectedHostIds), [selectedHostIds]);

  const groups = useMemo(() => {
    const searchLower = searchText.toLowerCase();

    // 创建一个 Map 来存储所有匹配标签的主机
    const matchedHostsByLabel = new Map<
      number,
      {
        id: number;
        name: string;
        ip: string;
        labelIds: number[];
      }
    >();

    // 处理无标签组
    const noLabelGroup = myHosts.find((group) => group.labelId === 0);
    const result = [];

    if (noLabelGroup) {
      const filteredNoLabelHosts = noLabelGroup.hosts
        .filter(
          (host) =>
            host.hostName.toLowerCase().includes(searchLower) ||
            host.hostIp.toLowerCase().includes(searchLower),
        )
        .map((host) => ({
          id: host.hostId,
          name: host.hostName,
          ip: host.hostIp,
          labelIds: [] as number[],
        }));

      if (filteredNoLabelHosts.length > 0) {
        result.push({
          label: t('无标签'),
          labelId: 0,
          hosts: filteredNoLabelHosts,
        });
      }
    }

    // 处理有标签的组
    myHosts
      .filter((group) => group.labelId !== 0)
      .forEach((group) => {
        const labelNameMatches = group.labelName.toLowerCase().includes(searchLower);

        group.hosts.forEach((host) => {
          const hostMatches =
            host.hostName.toLowerCase().includes(searchLower) ||
            host.hostIp.toLowerCase().includes(searchLower);

          // 如果标签名匹配或主机信息匹配，则添加到结果中
          if (labelNameMatches || hostMatches) {
            const existingHost = matchedHostsByLabel.get(host.hostId);
            if (existingHost) {
              // 如果主机已存在，添加新的标签ID
              existingHost.labelIds.push(group.labelId);
            } else {
              // 如果主机不存在，创建新记录
              matchedHostsByLabel.set(host.hostId, {
                id: host.hostId,
                name: host.hostName,
                ip: host.hostIp,
                labelIds: [group.labelId],
              });
            }
          }
        });
      });

    // 将匹配的主机按标签分组
    const labelGroups = Array.from(matchedHostsByLabel.values()).reduce((acc, host) => {
      host.labelIds.forEach((labelId) => {
        const group = myHosts.find((g) => g.labelId === labelId);
        if (group) {
          const existingGroup = acc.find((g) => g.labelId === labelId);
          if (existingGroup) {
            existingGroup.hosts.push(host);
          } else {
            acc.push({
              label: group.labelName,
              labelId: group.labelId,
              hosts: [host],
            });
          }
        }
      });
      return acc;
    }, [] as Array<{ label: string; labelId: number; hosts: Array<{ id: number; name: string; ip: string; labelIds: number[] }> }>);

    return [...result, ...labelGroups];
  }, [myHosts, searchText, t]);

  const handleToggleHost = (hostId: number) => {
    const newSelected = new Set(selectedHosts);
    if (newSelected.has(hostId)) {
      newSelected.delete(hostId);
    } else {
      newSelected.add(hostId);
    }
    const newSelectedArray = Array.from(newSelected);
    setSelectedHostIds(newSelectedArray);
    onChange?.(newSelectedArray);
  };

  const handleToggleGroup = (hostIds: number[]) => {
    const newSelected = new Set(selectedHosts);
    const allSelected = hostIds.every((id) => newSelected.has(id));

    if (allSelected) {
      hostIds.forEach((id) => newSelected.delete(id));
    } else {
      hostIds.forEach((id) => newSelected.add(id));
    }

    const newSelectedArray = Array.from(newSelected);
    setSelectedHostIds(newSelectedArray);
    onChange?.(newSelectedArray);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`} style={style}>
      <div className="relative">
        <Input
          prefix={<Iconify icon="flowbite:search-outline" className="text-gray-400" />}
          placeholder={t('输入主机名/IP/标签检索')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="bg-gray-50 focus:border-blue-500 focus:ring-blue-500 w-full rounded-lg border-gray-200 pl-10 focus:ring-1"
        />
      </div>

      <div
        className="bg-white overflow-auto rounded-lg border border-gray-100 p-3"
        style={{ maxHeight: '460px' }}
      >
        {groups.map((group) => (
          <GroupItem
            key={group.labelId}
            label={group.label}
            hosts={group.hosts}
            selectedHosts={selectedHosts}
            onToggleHost={handleToggleHost}
            onToggleGroup={handleToggleGroup}
          />
        ))}
      </div>
    </div>
  );
}
