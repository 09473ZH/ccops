import { Tree, Button, Typography, Popover } from 'antd';

import type { HostInfo } from '@/api/services/hostService';
import { Iconify } from '@/components/icon';
import { TableState } from '@/hooks/useTable';

import { HOST_TABLE_CONFIG } from '../../config/columns';

import { ColumnGroup } from './columns';

import type { ColumnType, Key } from 'antd/es/table/interface';
import type { DataNode } from 'antd/es/tree';

export interface ColumnSelectorProps {
  visibleColumns: string[];
  setTableState: (state: Partial<TableState<HostInfo>>) => void;
  columns: ColumnType<HostInfo>[];
  columnGroups: ColumnGroup[];
}
export function ColumnSelector({
  visibleColumns,
  setTableState,
  columns,
  columnGroups,
}: ColumnSelectorProps) {
  const { FIXED_COLUMNS } = HOST_TABLE_CONFIG;

  const allColumnKeys = columns
    .map((col) => col.key as string)
    .filter((key) => !FIXED_COLUMNS.includes(key));

  const checkedKeys = visibleColumns.filter((key) => !FIXED_COLUMNS.includes(key));
  const isAllSelected = checkedKeys.length === allColumnKeys.length;

  // 构建树形数据
  const treeData: DataNode[] = columnGroups.map((group) => ({
    title: group.title,
    key: group.key,
    children: group.children
      .filter((item) => !FIXED_COLUMNS.includes(item.key))
      .map((item) => ({
        title: item.title,
        key: item.key,
      })),
  }));

  const handleCheck = (checked: Key[] | { checked: Key[]; halfChecked: Key[] }) => {
    const newChecked = Array.isArray(checked) ? checked : checked.checked;
    setTableState({
      visibleColumns: [...FIXED_COLUMNS, ...newChecked] as string[],
    });
  };

  const handleToggleAll = () => {
    setTableState({
      visibleColumns: isAllSelected ? FIXED_COLUMNS : [...FIXED_COLUMNS, ...allColumnKeys],
    });
  };

  return (
    <Popover
      content={
        <div style={{ width: 250 }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <Typography.Text strong>显示列</Typography.Text>
            <Button type="link" size="small" onClick={handleToggleAll}>
              {isAllSelected ? '取消全选' : '全选'}
            </Button>
          </div>
          <Tree
            checkable
            defaultExpandAll
            checkedKeys={checkedKeys}
            onCheck={handleCheck}
            treeData={treeData}
          />
        </div>
      }
      trigger="click"
      placement="bottomLeft"
    >
      <Button
        type="default"
        className="flex items-center space-x-1"
        icon={<Iconify icon="solar:settings-linear" />}
      >
        <span>显示列</span>
      </Button>
    </Popover>
  );
}
