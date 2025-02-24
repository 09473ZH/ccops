import adminSetting from './admin-setting.json';
import common from './common.json';
import components from './components.json';
import quickCommand from './quick-command.json';
import sys from './sys.json';

export default {
  ...common,
  ...sys,
  ...quickCommand,
  ...adminSetting,
  ...components,
};
