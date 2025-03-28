import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { Table, Button, Space, Input, Switch, Modal, Popconfirm } from 'antd';
import { ColumnType } from 'antd/es/table';
import debounce from 'lodash/debounce';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionButton } from '@/components/Button';
import { TextAreaWithCopy } from '@/components/TextAreaWithCopy';
import { useUserInfo } from '@/hooks/use-user';
import ProTag from '@/theme/antd/components/Tag';

import ResetPasswordModal from './components/ResetPasswordModal';
import UserModal from './components/UserModal';
import { useUserManage } from './hooks/use-user-manage';

import { UserInfo } from '#/entity';

export default function UserManagePage() {
  const { t } = useTranslation();
  const {
    modalOpen,
    modalMode,
    userList,
    isLoading,
    updateStatusMutation,
    deleteUserMutation,
    resetPasswordModalOpen,
    handleOpenModal,
    handleModalOk,
    handleCloseModal,
    handleResetPasswordOpen,
    handleResetPasswordOk,
    handleCloseResetPasswordModal,
    modalRecord,
    initUserModalOpen,
    initUserInfo,
    handleCloseInitUserModal,
  } = useUserManage();
  const [searchParams, setSearchParams] = useState({ page: 1, pageSize: 10, keyword: '' });
  const handleSearch = debounce((value: string) => {
    setSearchParams((prev) => ({ ...prev, keyword: value, page: 1 }));
  }, 300);
  const { userInfo } = useUserInfo();
  const columns: ColumnType<UserInfo>[] = [
    {
      title: t('user.username'),
      dataIndex: 'username',
      key: 'username',
      render: (text: string, record: UserInfo) => {
        return record.id === userInfo?.id ? `${userInfo.username}(You)` : text;
      },
    },
    {
      title: t('user.email'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('user.role'),
      dataIndex: 'role',
      key: 'role',
      render: (text: string) => {
        return text === 'admin' ? (
          <ProTag color="blue">{t('user.roleAdmin')}</ProTag>
        ) : (
          <ProTag color="green">{t('user.roleUser')}</ProTag>
        );
      },
    },
    {
      title: t('user.status'),
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      render: (status: boolean, record: any) => (
        <Switch
          checked={status}
          onChange={(checked) => updateStatusMutation.mutate({ id: record.id, status: checked })}
        />
      ),
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: unknown, record: UserInfo) => (
        <Space size="middle">
          <ActionButton
            icon="edit"
            onClick={() => handleOpenModal('edit', record)}
            tooltip={t('user.editUser')}
          />
          <ActionButton
            icon="resetPassword"
            onClick={() => handleResetPasswordOpen(record)}
            tooltip={t('user.resetPassword')}
          />
          <Popconfirm
            title={t('common.deleteConfirm')}
            onConfirm={() => deleteUserMutation.mutate(String(record.id))}
            okText={t('common.okText')}
            cancelText={t('common.cancelText')}
          >
            <ActionButton
              icon="delete"
              danger
              disabled={record.id === userInfo?.id}
              tooltip={
                record.id === userInfo?.id ? t('user.cannotDeleteSelf') : t('user.deleteUser')
              }
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-4 flex justify-between">
        <Input
          placeholder={t('user.search')}
          prefix={<SearchOutlined />}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 200 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal('create', {} as UserInfo)}
        >
          {t('user.createUser')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={userList?.list
          .filter(
            (user) =>
              user.username.toLowerCase().includes(searchParams.keyword.toLowerCase()) ||
              user.email.toLowerCase().includes(searchParams.keyword.toLowerCase()),
          )
          .sort((a, b) => {
            if (a.id === userInfo?.id) return -1;
            if (b.id === userInfo?.id) return 1;
            return 0;
          })}
        loading={isLoading}
        rowKey="id"
        pagination={{
          total: userList?.total,
          current: searchParams.page,
          pageSize: searchParams.pageSize,
          onChange: (page, pageSize) => setSearchParams((prev) => ({ ...prev, page, pageSize })),
        }}
      />

      <ResetPasswordModal
        open={resetPasswordModalOpen}
        onOk={handleResetPasswordOk}
        record={modalRecord}
        onCancel={handleCloseResetPasswordModal}
      />

      <UserModal
        open={modalOpen}
        mode={modalMode}
        onOk={handleModalOk}
        record={modalRecord}
        onCancel={handleCloseModal}
      />

      <Modal
        title={`${initUserInfo?.username} - ${t('user.initialPassword')}`}
        open={initUserModalOpen}
        onCancel={handleCloseInitUserModal}
        footer={null}
        width={400}
      >
        <div className="space-y-4 py-2">
          {[
            { label: 'user.email', content: initUserInfo?.email || t('user.emailNotFound') },
            {
              label: 'user.initialPassword',
              content: initUserInfo?.password || t('user.passwordInitFailed'),
            },
          ].map(({ label, content }) => (
            <div key={label} className="space-y-2">
              <div className="text-gray-700 dark:text-gray-500">{t(label)}:</div>
              <TextAreaWithCopy size="small" content={content} />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
