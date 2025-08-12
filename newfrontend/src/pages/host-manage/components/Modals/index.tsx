import { lazy } from 'react';

export const Modals = {
  Create: lazy(() =>
    import('./CreateHostModal').then((module) => ({
      default: module.CreateHostModal,
    })),
  ),
  AssignLabel: lazy(() =>
    import('./AssignLabelModal').then((module) => ({
      default: module.AssignLabelModal,
    })),
  ),
  LabelManage: lazy(() =>
    import('./LabelManageModal').then((module) => ({
      default: module.LabelManageModal,
    })),
  ),
  SshConfig: lazy(() =>
    import('./SshConfigModal').then((module) => ({
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
