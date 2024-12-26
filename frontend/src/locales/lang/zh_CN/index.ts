import common from './common.json';
import components from './components.json';
import quickCommand from './quick-command.json';
import sysConfig from './sys-config.json';
import sys from './sys.json';

export default {
  ...common,
  ...sys,
  ...quickCommand,
  ...sysConfig,
  ...components,
};
