import {
  Table,
  Typography,
  Space,
  Modal,
  Select,
  Switch,
  Popconfirm,
  TablePaginationConfig,
} from 'antd';
import * as monaco from 'monaco-editor';
import React, { useEffect, useState } from 'react';

import { FileInfo } from '@/api/services/fileService';
import { ActionButton } from '@/components/button';
import { FileIcon } from '@/components/icon';
import CodeEditor from '@/components/monaco-editor';
import ShowTooltip from '@/components/show-tooltip';
import { useFileList } from '@/hooks/useFileList';
import { useModalsControl } from '@/hooks/useModalsControl';
import { useTable } from '@/hooks/useTable';
import { formatBytes } from '@/utils/format-number';
import { formatDateTime, formatTimeAgo } from '@/utils/format-time';

import { useFile, useFilePreview } from './useFile';

interface EditorState {
  isPreview: boolean;
  fileId: number | undefined;
  content: string;
  language: string;
  showLineNumbers: boolean;
}

const initialEditorState: EditorState = {
  isPreview: true,
  fileId: undefined,
  content: '',
  language: 'plaintext',
  showLineNumbers: true,
};

interface FileTableProps {
  fileList?: FileInfo[];
  isLoading?: boolean;
  showPreview?: boolean;
  showEdit?: boolean;
  showDownload?: boolean;
  showDelete?: boolean;
  selectedRows?: number[];
  onSelectChange?: (selectedRowKeys: number[]) => void;
  pagination?: TablePaginationConfig;
  compact?: boolean;
}

function FileTable({
  fileList: externalFileList,
  isLoading: externalLoading,
  showPreview = true,
  showEdit = true,
  showDownload = true,
  showDelete = true,
  selectedRows,
  onSelectChange,
  pagination,
  compact = false,
}: FileTableProps) {
  const { list: internalFileList, isLoading: internalLoading } = useFileList({
    enabled: !externalFileList,
  });
  const { editFile, deleteFiles, downloadFile } = useFile();
  const { open, close, isOpen } = useModalsControl({ modals: ['fileModal'] });
  const [editorState, setEditorState] = useState<EditorState>(initialEditorState);

  const { data: previewData } = useFilePreview(editorState.fileId!, {
    enabled: isOpen('fileModal') && !!editorState.fileId,
    isPreview: editorState.isPreview,
  });

  useEffect(() => {
    if (typeof previewData === 'string') {
      setEditorState((prev) => ({ ...prev, content: previewData }));
    }
  }, [previewData]);

  const finalFileList = externalFileList || internalFileList;
  const finalLoading = externalLoading ?? internalLoading;
  const { table, filteredData, paginatedData, handlePaginationChange, setTableState } = useTable({
    data: finalFileList,
  });

  const getLanguage = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return (
      monaco.languages
        .getLanguages()
        .find((lang) => lang.extensions?.some((ext) => ext.substring(1) === extension))?.id ||
      'plaintext'
    );
  };

  const handleFileAction = (record: FileInfo, action: 'preview' | 'edit') => {
    setEditorState({
      ...initialEditorState,
      fileId: record.id,
      isPreview: action === 'preview',
      language: getLanguage(record.fileName),
    });
    open('fileModal');
  };

  const handleEditOk = () => {
    if (editorState.fileId) {
      editFile({
        id: editorState.fileId,
        content: editorState.content,
      }).then(() => {
        close('fileModal');
      });
    }
  };

  const handleDownload = (record: FileInfo) => {
    if (record.id) {
      downloadFile({
        fileId: record.id,
        fileName: record.fileName,
      });
    }
  };

  const handleModalClose = () => {
    close('fileModal');
    setEditorState(initialEditorState);
  };

  const handleEditorChange = (value: string | undefined) => {
    setEditorState((prev) => ({ ...prev, content: value || '' }));
  };

  const handleSelectionChange = (keys: React.Key[]) => {
    setTableState({ selectedRows: keys });
    onSelectChange?.(keys as number[]);
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      render: (text: string) => (
        <div className={compact ? 'text-xs' : ''}>
          <FileIcon fileName={text} />
        </div>
      ),
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      render: (size: number) => (
        <Typography.Text className={compact ? 'text-xs' : ''}>{formatBytes(size)}</Typography.Text>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      render: (time: string) => (
        <div className={compact ? 'text-xs' : ''}>
          <ShowTooltip
            content={formatTimeAgo(time)}
            tooltipContent={formatDateTime(time)}
            placement="topLeft"
          />
        </div>
      ),
    },
    {
      title: '操作',
      render: (_: unknown, record: FileInfo) => (
        <Space>
          {showPreview && (
            <ActionButton
              icon="view"
              disabled={record.isBinaryFile === 1}
              onClick={() => handleFileAction(record, 'preview')}
            />
          )}
          {showEdit && (
            <ActionButton
              icon="edit"
              disabled={record.isBinaryFile === 1}
              onClick={() => handleFileAction(record, 'edit')}
            />
          )}
          {showDownload && <ActionButton icon="download" onClick={() => handleDownload(record)} />}
          {showDelete && (
            <Popconfirm
              title="确认删除"
              description="确定要删除这个文件吗？"
              okText="确认"
              cancelText="取消"
              onConfirm={() => deleteFiles([record.id])}
            >
              <ActionButton icon="delete" danger />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        scroll={{ x: 'max-content' }}
        columns={columns}
        dataSource={paginatedData}
        loading={finalLoading}
        rowSelection={
          compact
            ? undefined
            : {
                selectedRowKeys: selectedRows || table.selectedRows,
                onChange: handleSelectionChange,
              }
        }
        rowKey="id"
        size={compact ? 'small' : undefined}
        pagination={
          compact
            ? {
                pageSize: 5,
                hideOnSinglePage: true,
                showSizeChanger: false,
                size: 'small',
              }
            : pagination || {
                ...table,
                total: filteredData.length,
                onChange: handlePaginationChange,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }
        }
      />
      <Modal
        title={`${editorState.isPreview ? '预览' : '编辑'}文件`}
        open={isOpen('fileModal')}
        onOk={editorState.isPreview ? handleModalClose : handleEditOk}
        onCancel={handleModalClose}
        width={800}
        footer={editorState.isPreview ? null : undefined}
      >
        <div className="mb-4 flex items-center gap-4">
          <Select
            showSearch
            value={editorState.language}
            style={{ width: 200 }}
            onChange={(value) => setEditorState((prev) => ({ ...prev, language: value }))}
            options={monaco.languages.getLanguages().map((lang) => ({
              label: lang.aliases?.[0] || lang.id,
              value: lang.id,
            }))}
            filterOption={(input, option) =>
              (option?.label as string).toLowerCase().includes(input.toLowerCase())
            }
          />
          <div>
            <span className="mr-2">显示行数</span>
            <Switch
              checked={editorState.showLineNumbers}
              onChange={(checked) =>
                setEditorState((prev) => ({ ...prev, showLineNumbers: checked }))
              }
            />
          </div>
        </div>
        <CodeEditor
          height="400px"
          value={editorState.content}
          onChange={handleEditorChange}
          language={editorState.language}
          options={{
            readOnly: editorState.isPreview,
            lineNumbers: editorState.showLineNumbers ? 'on' : 'off',
          }}
        />
      </Modal>
    </>
  );
}

export default FileTable;
