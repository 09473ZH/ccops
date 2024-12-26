import { Modal, Space, Popover } from 'antd';
import React, { useState } from 'react';

import ProTag from '@/theme/antd/components/tag';

import type { ModalProps, PopoverProps } from 'antd';
import type { ReactNode } from 'react';

interface DataItem {
  id: number | string;
  [key: string]: any;
}
interface ShowMoreTagsProps<T extends DataItem> {
  /** 数据源数组 */
  dataSource: T[];
  /** 用于显示的字段名，默认为 'name' */
  labelField?: keyof T;
  /** 用于标签颜色的字段名 */
  colorField?: keyof T;
  /** 默认标签颜色 */
  color?: string;
  /** 最大显示数量，超出会显示展开按钮，默认为 3 */
  maxCount?: number;
  /** 标签样式 */
  tagStyle?: React.CSSProperties;
  /** 容器样式 */
  style?: React.CSSProperties;
  /** 单个标签的 popover 内容 */
  itemPopover?: (item: T) => ReactNode;
  /** 展开配置 */
  expand?: {
    /** 展开方式，默认为 'popover' */
    type?: 'popover' | 'modal';
    /** 自定义渲染展开内容 */
    render?: (items: T[]) => ReactNode;
    /** Modal 配置 */
    modal?: ModalProps;
    /** Popover 配置 */
    popover?: PopoverProps;
    /** 是否显示所有数据（包括未隐藏的），默认为 false */
    showAll?: boolean;
  };
}

/**
 * 标签列表组件，支持：
 * - 自动折叠/展开
 * - 标签悬浮提示
 * - 展开弹窗显示详情
 */
function ShowMoreTags<T extends DataItem>({
  dataSource,
  labelField = 'name',
  colorField,
  color = 'blue',
  maxCount = 3,
  tagStyle,
  style,
  itemPopover,
  expand = {},
}: ShowMoreTagsProps<T>) {
  const {
    type = 'popover',
    render = (items) => (
      <div className="max-h-[240px] overflow-y-auto overflow-x-hidden p-1.5">
        <Space wrap size={[4, 4]} className="flex-start">
          {items.map((item, index) => (
            <ProTag
              key={`${item.id || index}-${String(item[labelField])}`}
              color={colorField ? item[colorField] : color}
              style={{
                ...tagStyle,
                margin: 0,
                fontSize: '12px',
                lineHeight: '20px',
                padding: '0 8px',
              }}
            >
              {item[labelField]}
            </ProTag>
          ))}
        </Space>
      </div>
    ),
    showAll = false,
  } = expand;

  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!dataSource?.length) return null;

  const visibleItems = dataSource.slice(0, maxCount);
  const hiddenItems = dataSource.slice(maxCount);
  const restCount = hiddenItems.length;

  const renderMoreTag = () => {
    const tag = (
      <ProTag
        color={color}
        style={{ cursor: 'pointer', ...tagStyle }}
        onClick={() => type === 'modal' && setIsModalOpen(true)}
      >
        +{restCount}
      </ProTag>
    );

    if (type === 'modal') return tag;

    return (
      <Popover
        content={render(showAll ? dataSource : hiddenItems)}
        trigger="hover"
        placement="top"
        overlayClassName="show-more-tags-popover"
        {...(expand.popover as PopoverProps)}
      >
        {tag}
      </Popover>
    );
  };

  return (
    <>
      <Space wrap style={{ gap: '4px', ...style }}>
        {visibleItems.map((item, index) => {
          const tag = (
            <ProTag color={colorField ? item[colorField] : color} style={tagStyle}>
              {item[labelField]}
            </ProTag>
          );

          return itemPopover ? (
            <Popover
              key={`${item.id || index}-${String(item[labelField])}`}
              content={itemPopover(item)}
              trigger="hover"
              placement="top"
              overlayClassName="show-more-tags-popover"
              overlayInnerStyle={{
                padding: '4px 8px',
                fontSize: '12px',
                lineHeight: '1.5',
                maxWidth: '200px',
                minHeight: '24px',
                wordBreak: 'break-all',
              }}
            >
              {tag}
            </Popover>
          ) : (
            <React.Fragment key={`${item.id || index}-${String(item[labelField])}`}>
              {tag}
            </React.Fragment>
          );
        })}
        {hiddenItems.length > 0 && renderMoreTag()}
      </Space>

      {type === 'modal' && (
        <Modal
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          {...expand.modal}
        >
          <div style={expand.modal?.wrapStyle} className={expand.modal?.wrapClassName}>
            {render(showAll ? dataSource : hiddenItems)}
          </div>
        </Modal>
      )}
    </>
  );
}

export default ShowMoreTags;
