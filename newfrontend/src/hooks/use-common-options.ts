import { useQuery } from '@tanstack/react-query';
import { FormInstance } from 'antd';

import hostService, { HostListResponse } from '@/api/services/host';
import labelService, { LabelListResponse } from '@/api/services/label';

export interface SelectOption {
  label: string;
  value: number;
}

export const ALL_OPTION_VALUE = -1;

interface UseAllSelectProps {
  options: SelectOption[];
  values: number[];
}

export function useAllSelect({ options, values }: UseAllSelectProps) {
  const hasAll = options.length > 0 && options.every((option) => values.includes(option.value));

  const handleChange = (value: number[], form: FormInstance, field: string) => {
    const lastValue = value[value.length - 1];
    const prevValues = form.getFieldValue(['permissions', field]);

    let newValue: number[];
    if (lastValue === ALL_OPTION_VALUE) {
      newValue = [ALL_OPTION_VALUE];
    } else if (prevValues.includes(ALL_OPTION_VALUE)) {
      newValue = value.filter((v) => v !== ALL_OPTION_VALUE);
    } else {
      newValue = value;
    }

    form.setFieldValue(['permissions', field], newValue);
  };

  // 获取最终提交值
  const getFinalValue = (selectedValues: number[]) => {
    return selectedValues.includes(ALL_OPTION_VALUE)
      ? options.map((option) => option.value)
      : selectedValues;
  };

  return {
    initialValue: hasAll ? [ALL_OPTION_VALUE] : values,
    handleChange,
    getFinalValue,
  };
}

export function getSubmitValues(selected: number[], options: SelectOption[]) {
  if (selected.includes(ALL_OPTION_VALUE)) {
    return options.filter((opt) => opt.value !== ALL_OPTION_VALUE).map((opt) => opt.value);
  }

  return selected;
}

export function useHostOptions() {
  const { data } = useQuery<HostListResponse>({
    queryKey: ['hostList'],
    queryFn: () => hostService.getHosts(),
  });

  const options =
    data?.list.map((host) => ({
      label: host.name,
      value: host.id,
    })) || [];

  return options;
}

export function useLabelOptions() {
  const { data } = useQuery<LabelListResponse>({
    queryKey: ['labels'],
    queryFn: () => labelService.getLabelList(),
  });

  const options =
    data?.list.map((label) => ({
      label: label.name,
      value: label.id,
    })) || [];

  return options;
}
