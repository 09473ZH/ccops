import fileManage from './modules/file-manage';
import hostManage from './modules/host-manage';
import quickCommand from './modules/quick-command';
import softwareManage from './modules/software-manage';
import systemSettings from './modules/system-settings';
import taskManage from './modules/task-manage';

export const asyncRoutes = [
  ...hostManage,
  ...fileManage,
  ...softwareManage,
  ...taskManage,
  quickCommand,
  ...systemSettings,
];
