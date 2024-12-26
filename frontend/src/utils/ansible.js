/* eslint-disable */
import yaml from 'js-yaml';

const roleContent = `
---
- name: 使用 apt 模块安装 htop
  apt:
    name: htop
    state: present
  when: ansible_facts.distribution == "CentOS"
`;

export function parseRole(role) {
  const doc = yaml.load(role);

  const tasks = doc.map((task) => {
    const taskObj = {
      name: task.name,
      module: '',
      module_args: {},
    };

    for (const key in task) {
      if (key === 'name') {
        taskObj.name = task[key];
      } else if (typeof task[key] === 'object' && task[key] !== null) {
        // Treat this key as the module if its value is an object
        taskObj.module = key;
        taskObj.module_args = task[key];
      } else {
        taskObj[key] = task[key];
      }
    }

    return taskObj;
  });

  return tasks; // Directly return the list of task objects
}

const roleObject = parseRole(roleContent);
console.log(JSON.stringify(roleObject, null, 2));

// 输入的 JSON 对象
const jsonContent = [
  {
    name: '使用 apt 模块安装 htop',
    module: 'apt',
    module_args: {
      name: 'htop',
      state: 'present',
    },
    when: 'ansible_facts.distribution == "CentOS"',
  },
];

function jsonToYaml(json) {
  const yamlTasks = json.map((task) => {
    const { name, module, module_args, ...rest } = task;
    const yamlTask = {
      name,
      [module]: module_args,
      ...rest,
    };
    return yamlTask;
  });

  return yaml.dump(yamlTasks);
}

const yamlOutput = jsonToYaml(jsonContent);

// 添加新的函数来提取变量
export function extractVariables(roleContent) {
  const variables = new Set();
  
  // 只匹配 {{ variable }} 形式的变量
  const mustachePattern = /\{\{\s*([^}]+)\s*\}\}/g;
  
  // 将 YAML 转换为字符串进行搜索
  const yamlString = typeof roleContent === 'string' 
    ? roleContent 
    : yaml.dump(roleContent);

  // 查找所有 {{ variable }} 形式的变量
  let match;
  while ((match = mustachePattern.exec(yamlString)) !== null) {
    // 清理变量名（去除空格和可能的过滤器）
    const varName = match[1].trim().split('|')[0].trim();
    
    // 排除以下情况：
    // 1. ansible_ 开头的系统变量
    // 2. item 变量（循环中的特殊变量）
    // 3. range() 函数
    // 4. dict2items 过滤器
    if (!varName.startsWith('ansible_') && 
        !varName.startsWith('range(') &&
        !varName.includes('dict2items') &&
        varName !== 'item' &&
        !varName.startsWith('item.')) {
      variables.add(varName);
    }
  }

  // 解析 YAML 来获取 vars 部分定义的变量
  try {
    const doc = yaml.load(yamlString);
    if (Array.isArray(doc)) {
      doc.forEach(task => {
        if (task.vars) {
          Object.keys(task.vars).forEach(key => {
            variables.add(key);
          });
        }
      });
    }
  } catch (e) {
    console.warn('YAML 解析错误，跳过 vars 解析', e);
  }

  return Array.from(variables);
}

// 测试用例
const loopExample = `
---
- name: 使用简单循环打印数字
  debug:
    msg: "数字: {{ item }}"
  loop:
    - 1
    - 2
    - 3

- name: 循环打印水果列表
  debug:
    msg: "水果名称: {{ item.name }}，颜色: {{ item.color }}"
  loop:
    - { name: '{{ fruit_name }}', color: '{{ fruit_color }}' }

- name: 使用序列循环
  debug:
    msg: "这是第 {{ item }} 次循环"
  loop: "{{ range(1, 4) | list }}"

- name: 循环打印系统信息
  debug:
    msg: "{{ item.key }}: {{ item.value }}"
  loop: "{{ system_info | dict2items }}"
  vars:
    system_info:
      version: "{{ version_number }}"
      custom_var: "{{ my_variable }}"
`;

const variables = extractVariables(loopExample);
console.log('发现的变量：', variables);
// 输出: ['fruit_name', 'fruit_color', 'version_number', 'my_variable', 'system_info']