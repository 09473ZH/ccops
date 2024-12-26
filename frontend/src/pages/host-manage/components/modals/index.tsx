import { lazy } from 'react';

export const Modals = {
  Create: lazy(() =>
    import('./create-host-modal').then((module) => ({
      default: module.CreateHostModal,
    })),
  ),
  AssignLabel: lazy(() =>
    import('./assign-label-modal').then((module) => ({
      default: module.AssignLabelModal,
    })),
  ),
  LabelManage: lazy(() =>
    import('./label-manage-modal').then((module) => ({
      default: module.LabelManageModal,
    })),
  ),
  SshConfig: lazy(() =>
    import('./ssh-config-modal').then((module) => ({
      default: module.SshConfigModal,
    })),
  ),
};

export enum ModalName {
  Create = 'Create',
  AssignLabel = 'AssignLabel',
  LabelManage = 'LabelManage',
  SshConfig = 'SshConfig',
}
