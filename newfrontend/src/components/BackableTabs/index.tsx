import { Button } from 'antd';
import { type ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Iconify } from '@/components/Icon';
import { cn } from '@/utils';

export interface TabItem {
  /** 标签页的唯一标识 */
  key: string;
  /** 标签页显示的文本 */
  label: string;
  /** 标签页对应的内容 */
  children: ReactNode;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否懒加载（默认为 true） */
  lazy?: boolean;
}

export interface BackableTabsProps {
  /** 页面标题 */
  title: string;
  /** 返回按钮跳转路径 */
  backPath: string;
  /** 标签页配置 */
  items?: TabItem[];
  /** 当前激活 tab 面板的 key */
  activeKey?: string;
  /** 初始化选中面板的 key，如果没有设置 activeKey */
  defaultActiveKey?: string;
  /** 切换面板的回调 */
  onChange?: (activeKey: string) => void;
  /** 右侧额外的操作区域 */
  extra?: ReactNode;
  /** 内容区域的类名 */
  contentClassName?: string;
}

export function BackableTabs({
  title,
  backPath,
  items,
  activeKey: propActiveKey,
  defaultActiveKey,
  onChange,
  extra,
  contentClassName,
}: BackableTabsProps): JSX.Element {
  const navigate = useNavigate();

  // 记录已经渲染过的 tab
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set());
  // 内部维护一个 activeKey 状态
  const [internalActiveKey, setInternalActiveKey] = useState(
    propActiveKey ?? defaultActiveKey ?? items?.[0]?.key ?? '',
  );

  // 获取当前激活的内容
  const activeKey = propActiveKey ?? internalActiveKey;

  // 当 tab 切换时，记录已渲染的 tab
  useEffect(() => {
    if (activeKey && !mountedTabs.has(activeKey)) {
      setMountedTabs((prev) => new Set([...prev, activeKey]));
    }
  }, [activeKey, mountedTabs]);

  // 处理 tab 切换
  const handleTabChange = (key: string) => {
    setInternalActiveKey(key);
    onChange?.(key);
  };

  return (
    <div className="flex h-full flex-col">
      <section className="flex">
        <div className="flex w-full items-center">
          {/* 返回按钮和标题区域 */}
          <section className="flex items-center py-4">
            <div className="ml-6 flex items-center">
              <Button
                size="small"
                icon={<Iconify icon="solar:arrow-left-outline" />}
                onClick={() => navigate(backPath)}
                className="flex items-center"
              />
            </div>
            <div className="px-4 text-base font-medium text-[#333] dark:text-gray-200">{title}</div>
          </section>

          {/* 标签页导航区域 */}
          {items && (
            <section className="flex flex-1 items-center">
              <div className="ml-4 h-5 border-l border-[#f0f0f0] dark:border-gray-700" />
              <div className="flex-1">
                <ul className="ml-4 flex items-center">
                  {items.map((item) => (
                    <li
                      key={item.key}
                      role="tab"
                      aria-hidden={item.disabled}
                      aria-selected={activeKey === item.key}
                      tabIndex={activeKey === item.key ? 0 : -1}
                      onClick={() => {
                        if (!item.disabled) {
                          handleTabChange(item.key);
                        }
                      }}
                      className={cn(
                        'hover:bg-hover relative mx-1 cursor-pointer rounded px-3 py-1.5 text-sm text-gray transition-colors hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-200',
                        activeKey === item.key &&
                          'bg-hover font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200',
                        item.disabled && 'cursor-not-allowed opacity-50',
                      )}
                    >
                      <div className="whitespace-nowrap">{item.label}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* 额外的操作区域 */}
          {extra && <div className="ml-auto px-6">{extra}</div>}
        </div>
      </section>

      {/* 内容区域 */}
      <div className={cn('flex-1 overflow-auto px-6 py-4', contentClassName)}>
        {items?.map((item) => {
          const isActive = item.key === activeKey;
          const shouldRender = mountedTabs.has(item.key) || !item.lazy;

          if (!shouldRender) {
            return null;
          }

          return (
            <div
              key={item.key}
              role="tabpanel"
              hidden={!isActive}
              className={cn(
                'h-full transition-opacity duration-200',
                isActive ? 'opacity-100' : 'absolute opacity-0',
              )}
            >
              {item.children}
            </div>
          );
        })}
      </div>
    </div>
  );
}
