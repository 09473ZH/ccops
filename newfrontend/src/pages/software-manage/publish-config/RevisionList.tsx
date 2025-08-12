import { Table, Space, Modal, Typography, Select, List, Empty, Popconfirm } from 'antd';
import { useEffect, useCallback, useState, useMemo } from 'react';

import { RevisionItem } from '@/api/services/software';
import { ActionButton } from '@/components/Button';
import { DiffViewer } from '@/components/DiffViewer';
import { FileIcon } from '@/components/Icon';
import ShowTooltip from '@/components/ShowTooltip';
import { useModalsControl } from '@/hooks/use-modals-control';
import {
  useRoleRevisions,
  useRevisionOperations,
  useRevisionStore,
} from '@/pages/software-manage/use-software';
import { formatTimeAgo } from '@/utils/format-time';

interface RevisionListProps {
  id: number;
  autoShowActivateModal?: boolean;
  revisionIdToActivate?: number;
}

function RevisionList({ id, autoShowActivateModal, revisionIdToActivate }: RevisionListProps) {
  const { data, isLoading } = useRoleRevisions(id);
  const revisions = useMemo(
    () =>
      data?.list
        .filter((revision) => revision.isRelease !== false)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [],
    [data],
  );
  const { activeRevision, deleteRevision } = useRevisionOperations();
  const { open, close, isOpen } = useModalsControl({ modals: ['compare', 'versionFileList'] });
  const {
    selectedFiles,
    currentId,
    currentContent,
    compareId,
    compareContent: newContent,
    isComparing,
    actions,
  } = useRevisionStore();
  const [showActivateModal, setShowActivateModal] = useState(autoShowActivateModal);

  const isNewVersion = (createdAt: string) => {
    const now = new Date();
    const versionTime = new Date(createdAt);
    return now.getTime() - versionTime.getTime() < 30000;
  };

  const handleFetchFileNames = (versionId: number) => {
    const version = revisions.find((v) => v.id === versionId);
    if (!version?.files) return;

    actions.setSelectedFiles(version.files.map((file) => file.fileName));
    open('versionFileList');
  };

  const handleVersionChange = (value: number) => {
    actions.setIsComparing(true);
    const selectedVersion = revisions.find((version) => version.id === value);
    if (selectedVersion) {
      actions.setCompareVersion(value, selectedVersion.taskContent || '');
    }
    setTimeout(() => actions.setIsComparing(false), 500);
  };

  const handleCompare = useCallback(
    (sourceId: number) => {
      const sourceVersion = revisions.find((version) => version.id === sourceId);
      const defaultTargetVersion =
        revisions.find((version) => version.id === sourceId - 1) ||
        revisions.find((version) => version.id !== sourceId);

      if (sourceVersion) {
        actions.setCurrentVersion(sourceId, sourceVersion.taskContent || '');
        if (defaultTargetVersion) {
          actions.setCompareVersion(
            defaultTargetVersion.id,
            defaultTargetVersion.taskContent || '',
          );
        }
        open('compare');
      }
    },
    [revisions, actions, open],
  );

  const getVersionOptions = (currentVersionId: number) => {
    return (
      revisions
        .filter((revision) => revision.id !== currentVersionId)
        .map((revision) => ({
          label: `版本 ${revision.id}`,
          value: revision.id,
        })) || []
    );
  };

  const hasComparableVersions = (currentId: number) => {
    return revisions && revisions.some((revision) => revision.id !== currentId);
  };

  useEffect(() => {
    if (revisions && revisions.length >= 2) {
      const [latestVersion, previousVersion] = revisions.slice(0, 2);

      if (latestVersion && previousVersion && isNewVersion(latestVersion.createdAt)) {
        handleCompare(latestVersion.id);
      }
    }
  }, [revisions, handleCompare]);

  useEffect(() => {
    if (autoShowActivateModal) {
      setShowActivateModal(true);
    }
  }, [autoShowActivateModal]);

  const handleActivate = () => {
    if (!revisionIdToActivate) return;
    activeRevision.mutate(revisionIdToActivate);
    setShowActivateModal(false);
  };

  const columns = [
    {
      title: '版本 ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '变更信息',
      dataIndex: 'changeLog',
      key: 'changeLog',
      render: (text: string) => (
        <ShowTooltip content={text} tooltipContent={text} maxWidth={120} placement="topLeft" />
      ),
    },
    {
      title: '打包时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => formatTimeAgo(time),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: RevisionItem) => (
        <Space size="middle">
          <Popconfirm
            title="确认激活"
            description={`你确定要激活版本 ${record.id} 吗？`}
            onConfirm={() => activeRevision.mutate(record.id)}
            disabled={record.isActive}
          >
            <ActionButton
              icon={record.isActive ? 'active' : 'inactive'}
              tooltip={record.isActive ? '版本已激活' : '激活版本'}
              color={record.isActive ? 'orange' : undefined}
              disabled={record.isActive}
            />
          </Popconfirm>
          {hasComparableVersions(record.id) && (
            <ActionButton icon="diff" tooltip="版本对比" onClick={() => handleCompare(record.id)} />
          )}
          <ActionButton
            icon="file"
            tooltip="文件列表"
            onClick={() => handleFetchFileNames(record.id)}
          />
          <Popconfirm
            title="确认删除"
            description={`你确定要删除版本 ${record.id} 吗？`}
            onConfirm={() => deleteRevision.mutate(record.id)}
          >
            <ActionButton
              icon="delete"
              disabled={record.isActive}
              danger
              tooltip={record.isActive ? '激活版本无法删除' : undefined}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderCompareContent = () => {
    if (isComparing) {
      return (
        <div className="flex h-[450px] items-center justify-center">
          <Typography.Text type="secondary">正在加载对比内容...</Typography.Text>
        </div>
      );
    }

    if (newContent) {
      return (
        <div className="h-[600px] overflow-auto px-1">
          <DiffViewer
            oldValue={newContent}
            newValue={currentContent}
            oldTitle={`版本 ${compareId}`}
            newTitle={`版本 ${currentId}`}
          />
        </div>
      );
    }

    return (
      <div className="flex h-[600px] items-center justify-center">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="flex flex-col items-center gap-2">
              <Typography.Text type="secondary" className="text-xs">
                请选择一个要对比的版本
              </Typography.Text>
            </div>
          }
        />
      </div>
    );
  };

  return (
    <div>
      <Table columns={columns} dataSource={revisions} rowKey="id" loading={isLoading} />
      <Modal
        title="版本对比"
        width={800}
        open={isOpen('compare')}
        onCancel={() => {
          close('compare');
          actions.reset();
        }}
        footer={null}
        styles={{
          body: {
            padding: '20px 24px',
            height: '600px',
            backgroundColor: 'var(--background-color)',
          },
        }}
      >
        <div className="flex h-full flex-col">
          <div className="bg-card mb-5 flex items-center justify-between rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Typography.Text type="secondary">对比版本</Typography.Text>
              <Select
                style={{ width: 200 }}
                size="middle"
                placeholder="请选择"
                onChange={handleVersionChange}
                value={compareId}
                options={getVersionOptions(currentId!)}
                disabled={!currentId}
              />
            </div>
            <div className="flex items-center gap-2">
              <Typography.Text type="secondary">当前版本</Typography.Text>
              <Typography.Text strong className="text-lg">
                {currentId}
              </Typography.Text>
            </div>
          </div>
          <div className="bg-card flex-1 overflow-hidden rounded-lg shadow-sm">
            {renderCompareContent()}
          </div>
        </div>
      </Modal>
      <Modal
        title="版本文件列表"
        open={isOpen('versionFileList')}
        onCancel={() => {
          close('versionFileList');
          actions.setSelectedFiles([]);
        }}
        footer={null}
      >
        <List
          dataSource={selectedFiles}
          renderItem={(file) => (
            <List.Item>
              <FileIcon fileName={file} />
            </List.Item>
          )}
        />
      </Modal>
      <Modal
        title="激活确认"
        open={showActivateModal}
        onOk={handleActivate}
        onCancel={() => setShowActivateModal(false)}
        okText="确认激活"
        cancelText="取消"
      >
        <p>版本发布后，需要激活才可生效。是否激活？</p>
      </Modal>
    </div>
  );
}

export default RevisionList;
