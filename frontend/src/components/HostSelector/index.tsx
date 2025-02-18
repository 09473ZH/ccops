/* eslint-disable react/no-unstable-nested-components */
import { CaretRightOutlined } from '@ant-design/icons';
import { Input, Checkbox } from 'antd';
import React, { useMemo, useState, useEffect } from 'react';
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
  isExpanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

// 标签组组件
const GroupItem: React.FC<GroupItemProps> = function GroupItem({
  label,
  hosts,
  selectedHosts,
  onToggleHost,
  onToggleGroup,
  isExpanded,
  onExpandChange,
}) {
  const { t } = useTranslation();
  const allSelected = hosts.every((host) => selectedHosts.has(host.id));
  const someSelected = !allSelected && hosts.some((host) => selectedHosts.has(host.id));

  return (
    <div className="bg-gray-50/30 mb-[0.5px] rounded-lg pl-2">
      <div className="hover:bg-white/80 flex cursor-pointer items-center gap-1 rounded pl-3 pr-2">
        <div className="flex flex-1 items-center gap-1" onClick={() => onExpandChange(!isExpanded)}>
          <div
            className="transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            <CaretRightOutlined className="text-xs text-gray-400" />
          </div>
          <Checkbox
            className="origin-left scale-75"
            checked={allSelected}
            indeterminate={someSelected}
            onChange={() => onToggleGroup(hosts.map((h) => h.id))}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="flex-1 text-xs text-gray-800">{label}</span>
        </div>
        <span className="bg-blue-50 text-blue-600 rounded px-1 text-xs">
          {hosts.length} {t('台')}
        </span>
      </div>
      {isExpanded && (
        <div
          className="overflow-hidden"
          style={{
            maxHeight: isExpanded ? '1000px' : '0',
            opacity: isExpanded ? 1 : 0,
            transitionDuration: '300ms',
          }}
        >
          <div className="mt-[0.5px] space-y-[0.5px] pl-5">
            {hosts.map((host) => (
              <div
                key={host.id}
                className="hover:bg-white/80 flex cursor-pointer items-center gap-1 rounded pl-5 pr-3"
                onClick={() => onToggleHost(host.id)}
              >
                <Checkbox
                  className="origin-left scale-75"
                  checked={selectedHosts.has(host.id)}
                  onChange={() => onToggleHost(host.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="flex-1 truncate text-xs text-gray-700">{host.name}</span>
                <span className="text-xs text-gray-500">{host.ip}</span>
              </div>
            ))}
          </div>
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
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(() => {
    const noLabelGroup = myHosts.find((group) => group.labelId === 0);
    return noLabelGroup ? new Set([0]) : new Set();
  });

  const groups = useMemo(() => {
    const searchLower = searchText.toLowerCase();
    const result = [];

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

    // 先处理有标签的组
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

    // 先添加所有标签组
    result.push(...labelGroups);

    // 最后处理无标签组
    const noLabelGroup = myHosts.find((group) => group.labelId === 0);
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
        // 确保无标签组总是最后一个
        result.push({
          label: t('无标签'),
          labelId: 0,
          hosts: filteredNoLabelHosts,
        });
      }
    }

    return result;
  }, [myHosts, searchText, t]);

  // 每次 groups 更新时，确保无标签组保持展开
  useEffect(() => {
    const hasNoLabelGroup = groups.some((group) => group.labelId === 0);
    if (hasNoLabelGroup) {
      setExpandedGroups((prev) => new Set([...prev, 0]));
    }
  }, [groups]);

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

  const handleExpandChange = (checked: boolean) => {
    if (checked) {
      const allGroupIds = groups.map((g) => g.labelId);
      setExpandedGroups(new Set(allGroupIds));
    } else {
      setExpandedGroups(new Set());
    }
  };

  const isAllExpanded =
    groups.length > 0 && groups.every((group) => expandedGroups.has(group.labelId));

  const allHostIds = useMemo(
    () => [...new Set(groups.flatMap((group) => group.hosts.map((host) => host.id)))],
    [groups],
  );
  const allSelected = allHostIds.length > 0 && allHostIds.every((id) => selectedHosts.has(id));
  const someSelected = !allSelected && allHostIds.some((id) => selectedHosts.has(id));

  return (
    <div className={`flex flex-col gap-3 ${className}`} style={style}>
      <div className="relative flex items-center gap-2">
        <Input
          size="small"
          prefix={<Iconify icon="flowbite:search-outline" className="text-xs text-gray-400" />}
          placeholder={t('输入主机名/IP/标签检索')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="bg-gray-50 focus:border-blue-500 focus:ring-blue-500 w-full rounded-lg border-gray-200 pl-10 focus:ring-1 [&>input::placeholder]:text-xs"
        />
      </div>

      <div className="bg-white overflow-auto rounded-lg border border-gray-100 p-3">
        <div className="space-y-[0.5px]">
          <div
            className="hover:bg-gray-50/30 flex cursor-pointer items-center gap-1 rounded-lg pr-2"
            onClick={() => handleExpandChange(!isAllExpanded)}
          >
            <div
              className="transition-transform duration-200"
              style={{ transform: isAllExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              <CaretRightOutlined className="text-xs text-gray-400" />
            </div>
            <Checkbox
              className="origin-left scale-75"
              checked={allSelected}
              indeterminate={someSelected}
              onChange={() => handleToggleGroup(allHostIds)}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="flex-1 text-xs text-gray-500">{t('全部')}</span>
            <span className="bg-blue-50 text-blue-600 rounded px-1 text-xs">
              {allHostIds.length} {t('台')}
            </span>
          </div>

          {groups.map((group) => (
            <GroupItem
              key={group.labelId}
              label={group.label}
              hosts={group.hosts}
              selectedHosts={selectedHosts}
              onToggleHost={handleToggleHost}
              onToggleGroup={handleToggleGroup}
              isExpanded={expandedGroups.has(group.labelId)}
              onExpandChange={(expanded) => {
                const newExpanded = new Set(expandedGroups);
                if (expanded) {
                  newExpanded.add(group.labelId);
                } else {
                  newExpanded.delete(group.labelId);
                }
                setExpandedGroups(newExpanded);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
