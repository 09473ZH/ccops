import {
  SaveOutlined,
  LoadingOutlined,
  SearchOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import {
  Form,
  Input,
  Typography,
  Button,
  Space,
  Tooltip,
  Collapse,
  Anchor,
  Switch,
  App,
} from 'antd';
import debounce from 'lodash/debounce';
import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Iconify } from '@/components/icon';
import type { ConfigItem, ConfigGroup } from '@/types/config';
import { cn } from '@/utils';

import { useSystemConfig, useSystemConfigStore } from './hooks/useSystemConfig';

import type { CollapseProps } from 'antd';

const { Title } = Typography;

function ExpandIcon({ isActive }: { isActive?: boolean }) {
  return <CaretRightOutlined rotate={isActive ? 90 : 0} />;
}

export default function SystemSettingsPage() {
  const [form] = Form.useForm();
  const contentRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { message } = App.useApp();

  const {
    isScrolled,
    searchText,
    savingFields,
    activeKeys,
    activeAnchor,
    isAccordion,
    setSearchText,
    setSavingFields,
    setActiveKeys,
    setActiveAnchor,
    setIsAccordion,
    loadingState,
  } = useSystemConfigStore();

  const {
    configList,
    isLoading: isConfigLoading,
    operations: { saveConfig },
  } = useSystemConfig(form);

  // 数据同步逻辑
  const syncFormData = useCallback(
    (configList: ConfigGroup[]) => {
      if (!configList?.length) return;

      const formData = configList.reduce<Record<string, string>>((acc, group) => {
        group.items.forEach((item) => {
          acc[item.key] = item.value;
        });
        return acc;
      }, {});

      form.setFieldsValue(formData);
    },
    [form],
  );

  useEffect(() => {
    syncFormData(configList);
  }, [configList, syncFormData]);

  const getFieldNames = useCallback((group: ConfigGroup) => {
    return group.items.map((item) => item.key);
  }, []);

  const handleSearch = debounce((value: string) => {
    const trimmedValue = value.trim().toLowerCase();
    if (trimmedValue === searchText) return;
    setSearchText(trimmedValue);
  }, 300);

  const saveOperations = useMemo(
    () => ({
      handleSaveAll: async () => {
        if (!configList?.length) {
          message.error('配置列表为空');
          return;
        }

        try {
          const allFieldNames = configList.flatMap(getFieldNames);
          await saveConfig(allFieldNames, 'saveAll');
        } catch (error) {
          message.error(error instanceof Error ? error.message : '保存配置失败');
        }
      },

      handleSaveGroup: async (section: ConfigGroup) => {
        const fieldNames = getFieldNames(section);
        await saveConfig(fieldNames, 'saveGroup');
      },

      handleSaveField: async (fieldName: string) => {
        setSavingFields((prev) => new Set(prev).add(fieldName));
        try {
          await saveConfig([fieldName], 'saveAll');
        } finally {
          setSavingFields((prev) => {
            const next = new Set(prev);
            next.delete(fieldName);
            return next;
          });
        }
      },
    }),
    [configList, getFieldNames, saveConfig, setSavingFields, message],
  );

  const renderFormInput = useCallback(
    (item: ConfigItem) => {
      const baseInputProps = {
        autoComplete: 'off',
        placeholder: t('config.inputPlaceholder', { label: item.description || item.key }),
        className: 'hover:border-primary focus:border-primary transition-colors',
      };

      const isSaving = savingFields.has(item.key);
      const suffix = (
        <Tooltip title={t('config.saveItem')}>
          {isSaving ? (
            <LoadingOutlined className="text-primary" />
          ) : (
            <SaveOutlined
              className="hover:text-primary cursor-pointer text-gray-400 transition-colors"
              onClick={() => saveOperations.handleSaveField(item.key)}
            />
          )}
        </Tooltip>
      );

      if (item.type === 'textarea') {
        return (
          <Input.TextArea
            {...baseInputProps}
            autoSize={{ minRows: 3, maxRows: 8 }}
            className="font-mono text-sm"
          />
        );
      }

      if (item.type === 'password') {
        return <Input.Password {...baseInputProps} suffix={suffix} visibilityToggle={false} />;
      }

      return <Input {...baseInputProps} suffix={suffix} />;
    },
    [t, savingFields, saveOperations],
  );

  const getCollapseItems = useMemo(() => {
    return (): Required<CollapseProps>['items'] =>
      (configList || [])
        .filter(
          (group) =>
            group.title.toLowerCase().includes(searchText.toLowerCase()) ||
            group.items.some((item) =>
              (item.description || item.key).toLowerCase().includes(searchText.toLowerCase()),
            ),
        )
        .map((group) => ({
          key: group.id,
          id: group.id,
          label: (
            <Title level={5} className="m-0">
              {t(`config.${group.title}`)}
            </Title>
          ),
          extra: group.groupSave && activeKeys.includes(group.id) && (
            <Button
              size="small"
              type="primary"
              icon={<SaveOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                saveOperations.handleSaveGroup(group);
              }}
              className="transition-opacity duration-200"
              loading={loadingState.saveGroup}
            >
              {t(`config.${group.title}`)}
            </Button>
          ),
          children: (
            <div id={group.id} className="space-y-4 transition-all duration-300 ease-in-out">
              {group.items.map((item) => (
                <Form.Item
                  key={item.key}
                  label={item.description || item.key}
                  name={item.key}
                  rules={[{ required: item.required, message: t('config.required') }]}
                  className={cn('animate-fadeIn opacity-0', {
                    'mb-8': item.type === 'textarea',
                  })}
                >
                  {renderFormInput(item)}
                </Form.Item>
              ))}
            </div>
          ),
        }));
  }, [
    configList,
    searchText,
    t,
    activeKeys,
    loadingState.saveGroup,
    saveOperations,
    renderFormInput,
  ]);

  const collapseItems = useMemo(() => {
    const items = getCollapseItems();
    return items;
  }, [getCollapseItems]);

  const handleCollapseChange = (keys: string | string[]) => {
    if (isAccordion) {
      const newKey = typeof keys === 'string' ? keys : keys[keys.length - 1];
      setActiveKeys(newKey ? [newKey] : []);
    } else {
      const newKeys = typeof keys === 'string' ? [keys] : keys;
      setActiveKeys(newKeys);
    }
  };

  const handleAnchorClick = useCallback(
    (e: React.MouseEvent<HTMLElement>, link: { href: string }) => {
      e.preventDefault();
      const targetId = link.href.split('#')[1];

      setActiveAnchor(`#${targetId}`);

      if (isAccordion) {
        setActiveKeys([targetId]);
      } else {
        setActiveKeys([...activeKeys, targetId]);
      }

      const targetElement = document.getElementById(targetId);
      if (targetElement && contentRef.current) {
        contentRef.current.scrollTo({
          top: targetElement.offsetTop - 64,
          behavior: 'smooth',
        });
      }
    },
    [isAccordion, activeKeys, setActiveKeys, setActiveAnchor],
  );

  return (
    <div className="flex h-full flex-col p-5">
      <div
        className={cn(
          'flex items-center border-b border-[#f0f0f0] transition-all duration-300 ease-in-out',
          {
            'shadow-b from-transparent via-transparent border-b-0 bg-gradient-to-b to-[rgba(227,167,167,0.05)] dark:to-[rgba(0,0,0,0.1)]':
              isScrolled,
          },
        )}
      >
        <div className="mb-5 flex w-full justify-end">
          <Space>
            <Button
              icon={<Iconify icon="flowbite:trash-bin-outline" />}
              onClick={() => form.resetFields()}
            >
              {t('config.resetAll')}
            </Button>
            <Button
              type="primary"
              icon={<Iconify icon="flowbite:floppy-disk-alt-outline" />}
              onClick={saveOperations.handleSaveAll}
              loading={loadingState.saveAll}
            >
              {t('config.saveAll')}
            </Button>
          </Space>
        </div>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        <div ref={contentRef} id="config-content" className="flex-1 overflow-y-auto scroll-smooth">
          <Form form={form} layout="vertical" className="w-full">
            {isConfigLoading ? (
              <div className="flex h-32 items-center justify-center">
                <LoadingOutlined className="text-primary text-2xl" />
              </div>
            ) : (
              <div className="space-y-10 py-6">
                <Collapse
                  ghost
                  activeKey={activeKeys}
                  onChange={handleCollapseChange}
                  expandIcon={ExpandIcon}
                  items={collapseItems}
                  accordion={isAccordion}
                  className="[&_.ant-collapse-content-box]:px-0 [&_.ant-collapse-header]:px-0"
                />
              </div>
            )}
          </Form>
        </div>

        <div className="w-80 border-l border-[#f0f0f0] dark:border-gray-700">
          <div className="sticky top-0 p-4">
            <div className="mb-6 space-y-4">
              <Input
                placeholder={t('config.searchSettings')}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
                prefix={<SearchOutlined className="text-gray-400" />}
                className="hover:border-primary"
              />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{t('config.collapseMode')}</span>
                <Tooltip
                  title={isAccordion ? t('config.accordionModeDesc') : t('config.multipleModeDesc')}
                >
                  <Switch checked={isAccordion} onChange={setIsAccordion} size="small" />
                </Tooltip>
              </div>
            </div>
            <Anchor
              getContainer={() => document.getElementById('config-content')!}
              items={collapseItems.map((item) => ({
                key: item.key as string,
                href: `#${item.key}`,
                title:
                  typeof item.label === 'object'
                    ? (item.label as React.ReactElement).props.children
                    : item.label,
              }))}
              onClick={handleAnchorClick}
              getCurrentAnchor={() => activeAnchor}
              affix={false}
              targetOffset={0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
