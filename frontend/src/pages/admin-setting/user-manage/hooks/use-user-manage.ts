import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import userService from '@/api/services/user';
import { useModalsControl } from '@/hooks/use-modals-control';

import { UserInfo } from '#/entity';

export interface InitUserInfo {
  username: string;
  email: string;
  password: string;
}

export function useUserManage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { open, close, isOpen } = useModalsControl({
    modals: ['userModal', 'resetPasswordModal', 'initialPasswordModal'],
  });

  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalRecord, setModalRecord] = useState<UserInfo>({
    id: 0,
    username: '',
    email: '',
    role: '',
    permissions: {
      hostIds: [],
      labelIds: [],
    },
    isEnabled: false,
    isInit: false,
  });

  const [initUserInfo, setInitUserInfo] = useState<InitUserInfo | null>(null);

  // 获取用户列表
  const { data: userList, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUserList(),
  });

  // 更新用户状态
  const updateStatusMutation = useMutation({
    mutationFn: (params: { id: string; status: boolean }) => userService.updateUserStatus(params),
    onSuccess: () => {
      toast.success(t('user.statusUpdateSuccess'));
      refreshTable();
    },
    onError: (error) => {
      toast.error(t(error.message));
    },
  });

  // 删除用户
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      toast.success(t('user.deleteSuccess'));
      refreshTable();
    },
    onError: (error) => {
      toast.error(t(error.message));
    },
  });

  // 重置密码
  const resetPasswordMutation = useMutation({
    mutationFn: (params: { id: string; password: string }) => userService.resetPassword(params),
    onSuccess: () => {
      toast.success(t('user.resetPasswordSuccess'));
      refreshTable();
      handleCloseResetPasswordModal();
    },
    onError: (error) => {
      toast.error(t(error.message));
    },
  });

  // 创建用户
  const createUser = useMutation({
    mutationFn: (params: {
      username: string;
      email: string;
      role: string;
      permissions: {
        hostIds: number[];
        labelIds: number[];
      };
    }) => userService.createUser(params),
    onSuccess: (response) => {
      toast.success(t('common.createSuccess'));
      setInitUserInfo(response as InitUserInfo);
      open('initUserModal');
      handleCloseModal();
      refreshTable();
    },
    onError: (error) => {
      toast.error(t(error.message));
    },
  });

  // 分配权限
  const assignPermissions = useMutation({
    mutationFn: (params: {
      userId: string;
      role: string;
      permissions: {
        hostIds: number[];
        labelIds: number[];
      };
    }) => userService.assignPermissions(params),
    onSuccess: () => {
      toast.success(t('common.updateSuccess'));
      refreshTable();
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(t(error.message));
    },
  });

  const handleOpenModal = (mode: 'create' | 'edit', record: UserInfo) => {
    setModalMode(mode);
    setModalRecord(record);
    open('userModal');
  };

  const handleResetPasswordOpen = (record: UserInfo) => {
    setModalRecord(record);
    open('resetPasswordModal');
  };

  const handleResetPasswordOk = (values: { password: string }) => {
    resetPasswordMutation.mutate({
      id: String(modalRecord?.id),
      password: values.password,
    });
    close('resetPasswordModal');
  };

  const handleModalOk = async (values: {
    username: string;
    email: string;
    role: string;
    permissions: { hostIds: number[]; labelIds: number[] };
  }) => {
    if (modalMode === 'create') {
      createUser.mutate({
        username: values.username,
        email: values.email,
        role: values.role,
        permissions: values.permissions,
      });
    } else {
      assignPermissions.mutate({
        userId: String(modalRecord?.id),
        role: values.role,
        permissions: values.permissions,
      });
    }
  };

  const handleCloseModal = () => {
    close('userModal');
  };

  const handleCloseResetPasswordModal = () => {
    close('resetPasswordModal');
  };

  const handleCloseInitUserModal = () => {
    close('initUserModal');
    setInitUserInfo(null);
  };

  const refreshTable = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  return {
    modalOpen: isOpen('userModal'),
    modalMode,
    userList,
    isLoading,
    updateStatusMutation,
    deleteUserMutation,
    handleOpenModal,
    handleModalOk,
    handleCloseModal,
    resetPasswordModalOpen: isOpen('resetPasswordModal'),
    handleResetPasswordOpen,
    handleResetPasswordOk,
    handleCloseResetPasswordModal,
    modalRecord,
    initUserModalOpen: isOpen('initUserModal'),
    initUserInfo,
    handleCloseInitUserModal,
  };
}
