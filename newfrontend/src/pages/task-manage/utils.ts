import { TaskInfo } from '@/api/services/task';

export function generateTaskName(roleIdList: number[], roleList: any[]) {
  if (!roleIdList?.length) return '';

  // 获取选中的角色名称
  const selectedRoles = roleList
    .filter((role) => roleIdList.includes(role.id))
    .map((role) => role.name);

  const count = selectedRoles.length;

  if (count === 0) return '';
  if (count === 1) return `${selectedRoles[0]}`;
  if (count === 2) return `${selectedRoles[0]}、${selectedRoles[1]}`; // 只有两个时直接显示

  // 三个或更多时显示等xxx个软件
  return `安装${selectedRoles[0]}、${selectedRoles[1]}等${selectedRoles.length}个软件`;
}

/**
 * 将任务详情中的角色变量转换为统一格式
 * @param record 任务信息
 * @returns 标准化后的角色变量配置
 */
export function normalizeTaskVars(record: TaskInfo) {
  return (
    record.roleDetails?.roleVarContent
      ?.filter((role) => role.content)
      .flatMap((role) =>
        role.content.map((item) => ({
          roleId: role.roleId,
          key: item.key,
          value: item.value,
        })),
      ) || []
  );
}
