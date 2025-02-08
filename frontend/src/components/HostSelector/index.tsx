/* eslint-disable react/no-unstable-nested-components */
import { QuestionCircleOutlined, TagsOutlined } from '@ant-design/icons';
import { Select, Tooltip } from 'antd';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { HostInfo } from '@/api/services/host';

interface HostSelectorProps {
  hostList: HostInfo[];
  value?: number[];
  onChange?: (value: number[]) => void;
  className?: string;
  style?: React.CSSProperties;
}

interface SelectOptionType {
  label: React.ReactNode;
  value: number;
  searchLabel: string;
}

interface TagPlaceholderProps {
  omittedValues: any[];
}

function TagPlaceholder({ omittedValues }: TagPlaceholderProps) {
  const { t } = useTranslation();

  return (
    <Tooltip
      title={
        <div className="flex flex-col gap-1">
          {omittedValues.map((item, index) => (
            <div key={index}>{item.label}</div>
          ))}
        </div>
      }
      placement="top"
    >
      <span className="text-gray-500">
        {t('components.host-selector.show-more')} ({omittedValues.length})
      </span>
    </Tooltip>
  );
}

export default function HostSelector({
  hostList,
  value = [],
  onChange,
  className,
  style,
}: HostSelectorProps) {
  const { t } = useTranslation();
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [enableLabelFilter, setEnableLabelFilter] = useState(true);

  // 构建主机和标签的选项数据
  const { hostOptions, labelOptions, hostsByLabel } = useMemo(() => {
    const labelMap = new Map<number, number[]>();
    const labelOpts: SelectOptionType[] = [];

    // 构建标签映射和选项
    hostList.forEach((host) => {
      host.label?.forEach((label: { id: number; name: string }) => {
        if (!labelMap.has(label.id)) {
          const hostCount = hostList.filter((h) => h.label?.some((l) => l.id === label.id)).length;

          labelOpts.push({
            label: (
              <div className="flex items-center justify-between">
                <span>{label.name}</span>
                <span className="mx-2 text-xs text-gray-500">
                  {`${hostCount} ${t('components.host-selector.hosts')}`}
                </span>
              </div>
            ),
            value: label.id,
            searchLabel: label.name,
          });
          labelMap.set(label.id, []);
        }
        labelMap.get(label.id)?.push(host.id);
      });
    });

    // 构建主机选项
    const hostOpts: SelectOptionType[] = hostList.map((host) => ({
      label: `${host.name}@${host.hostServerUrl}`,
      value: host.id,
      searchLabel: `${host.name}@${host.hostServerUrl}`,
    }));

    return {
      hostOptions: hostOpts,
      labelOptions: labelOpts,
      hostsByLabel: labelMap,
    };
  }, [hostList, t]);

  // 计算通过标签选中的主机
  const hostsFromLabels = useMemo(
    () => new Set(selectedLabels.flatMap((labelId) => hostsByLabel.get(labelId) || [])),
    [selectedLabels, hostsByLabel],
  );

  // 处理主机选项的禁用状态
  const filteredHostOptions = useMemo(
    () =>
      hostOptions.map((option) => ({
        ...option,
        disabled: enableLabelFilter && hostsFromLabels.has(option.value),
        label: (
          <div className="flex items-center justify-between">
            <Tooltip title={option.searchLabel} placement="topLeft">
              <span className="max-w-[200px] truncate">{option.searchLabel}</span>
            </Tooltip>
            {enableLabelFilter && hostsFromLabels.has(option.value) && (
              <Tooltip title={t('components.host-selector.host-selected-by-label-des')}>
                <span className="ml-2 shrink-0 text-xs text-gray-500">
                  {t('components.host-selector.host-selected-by-label')}
                </span>
              </Tooltip>
            )}
          </div>
        ),
      })),
    [hostOptions, hostsFromLabels, enableLabelFilter, t],
  );

  // 处理标签变化
  const handleLabelChange = (selectedLabelIds: number[]) => {
    setSelectedLabels(selectedLabelIds);
    const newHostsFromLabels = new Set(
      selectedLabelIds.flatMap((labelId) => hostsByLabel.get(labelId) || []),
    );
    const newDirectSelected = value.filter((hostId) => !newHostsFromLabels.has(hostId));
    onChange?.(Array.from(new Set([...newDirectSelected, ...Array.from(newHostsFromLabels)])));
  };

  // 处理主机选择变化
  const handleHostChange = (selectedHostIds: number[]) => {
    onChange?.(Array.from(new Set([...selectedHostIds, ...Array.from(hostsFromLabels)])));
  };

  // 处理标签过滤开关
  const handleFilterChange = (checked: boolean) => {
    setEnableLabelFilter(checked);
    if (!checked) {
      setSelectedLabels([]);
      onChange?.([]);
    }
  };

  return (
    <div className={`${className} flex w-full flex-wrap items-center gap-4`} style={style}>
      <div className="flex min-w-[240px] flex-1 items-center gap-2">
        <Select
          className="w-full"
          size="middle"
          mode="multiple"
          allowClear
          value={value.filter((hostId) => !hostsFromLabels.has(hostId))}
          options={filteredHostOptions}
          placeholder={t('components.host-selector.host-placeholder')}
          onChange={handleHostChange}
          maxTagCount="responsive"
          listHeight={300}
          showSearch
          optionFilterProp="searchLabel"
          notFoundContent={t('components.host-selector.no-available-hosts')}
          maxTagPlaceholder={(omittedValues) => <TagPlaceholder omittedValues={omittedValues} />}
        />
      </div>

      <Tooltip
        title={
          enableLabelFilter
            ? t('components.host-selector.disable-label-filter')
            : t('components.host-selector.enable-label-filter')
        }
        placement="top"
      >
        <button
          type="button"
          onClick={() => handleFilterChange(!enableLabelFilter)}
          className={`
            inline-flex h-8 shrink-0 items-center gap-1 rounded px-3 text-xs font-medium 
            transition-all duration-200 ease-in-out
            ${
              enableLabelFilter
                ? 'bg-primary-50 text-primary-500 hover:bg-primary-100 shadow-sm'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }
          `}
        >
          <TagsOutlined className="text-sm" />
          {t('components.host-selector.label')}
        </button>
      </Tooltip>

      {enableLabelFilter && (
        <div className="flex min-w-[240px] flex-1 items-center gap-2">
          <Tooltip title={t('components.host-selector.label-tooltip')} placement="top">
            <QuestionCircleOutlined className="cursor-pointer text-gray-400 transition-colors duration-200 hover:text-gray-600" />
          </Tooltip>
          <Select
            className="w-full"
            size="middle"
            mode="multiple"
            allowClear
            value={selectedLabels}
            options={labelOptions}
            placeholder={t('components.host-selector.label-placeholder')}
            onChange={handleLabelChange}
            maxTagCount="responsive"
            listHeight={300}
            showSearch
            optionFilterProp="searchLabel"
            maxTagPlaceholder={(omittedValues) => <TagPlaceholder omittedValues={omittedValues} />}
          />
        </div>
      )}
    </div>
  );
}
