import { lazy } from 'react';

export const Modals = {
  Create: lazy(() =>
    import('./CreateHostModal').then((module) => ({
      default: module.CreateHostModal,
    })),
  ),
  AssignAnnotation: lazy(() =>
    import('./AssignAnnotationModal').then((module) => ({
      default: module.AssignAnnotationModal,
    })),
  ),
  AnnotationManage: lazy(() =>
    import('./AnnotationManageModal').then((module) => ({
      default: module.AnnotationManageModal,
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
  AssignAnnotation = 'AssignAnnotation',
  AnnotationManage = 'AnnotationManage',
  SshConfig = 'SshConfig',
}
