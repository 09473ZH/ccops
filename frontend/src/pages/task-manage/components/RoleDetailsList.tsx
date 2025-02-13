import { Typography, Space, Table } from 'antd';
import React from 'react';

import { RoleItem } from '@/api/services/software';
import { RoleDetails, RoleVarContent } from '@/api/services/task';
import ShowMoreTags from '@/components/ShowMoreTags';
import { useRoleList } from '@/pages/software-manage/use-software';

const { Text } = Typography;

interface RoleDetailsListProps {
  roleDetails: RoleDetails;
}

export default function RoleDetailsList({ roleDetails }: RoleDetailsListProps) {
  const { data: roleList } = useRoleList();
  if (!roleDetails?.roleIdList?.length) return null;

  const hasVarContent = (content: RoleVarContent['content']) => {
    if (content === null || content === undefined) return false;
    if (Array.isArray(content)) return content.length > 0;
    if (typeof content === 'object') return Object.keys(content).length > 0;
    return true;
  };

  const renderVarContent = (content: RoleVarContent['content']) => {
    if (!hasVarContent(content)) return null;

    let items: { key: string; value: string }[] = [];

    if (Array.isArray(content)) {
      items = content.map((item) => ({
        key: String(item.key),
        value: String(item.value),
      }));
    } else if (typeof content === 'object' && content !== null) {
      items = Object.entries(content).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      }));
    } else {
      items = [{ key: '值', value: String(content) }];
    }

    return (
      <Space direction="vertical" size="small">
        {items.map(({ key, value }, index) => (
          <Text key={`${key}-${index}`} type="secondary">
            {key}: {value}
          </Text>
        ))}
      </Space>
    );
  };

  const roleDetailsWithId = roleDetails.roleIdList.map((roleId: number, index: number) => {
    const matchingVarContent = roleDetails.roleVarContent?.filter(
      (content) => content.roleId === roleId,
    );

    return {
      id: `${roleId}-${index}`,
      roleId,
      roleVarContent: matchingVarContent || [],
      roleName:
        roleList?.list.find((role: RoleItem) => role.id === roleId)?.name || `软件 - ${roleId}`,
      customId: `${roleId}-${index}`,
    };
  });

  const renderRoleVarContent = (roleVarContent?: RoleVarContent[]) => {
    if (!roleVarContent?.length) return undefined;
    return (
      <Space direction="vertical" size="small">
        {roleVarContent.map((varContent: RoleVarContent, index: number) => (
          <div key={index}>
            {hasVarContent(varContent.content) && renderVarContent(varContent.content)}
          </div>
        ))}
      </Space>
    );
  };

  const renderItemPopover = (item: (typeof roleDetailsWithId)[0]) => {
    return renderRoleVarContent(item.roleVarContent);
  };

  return (
    <ShowMoreTags
      dataSource={roleDetailsWithId}
      itemPopover={renderItemPopover}
      labelField="roleName"
      maxCount={2}
      color="#87d068"
      expand={{
        type: 'modal',
        render: (roles) => (
          <div style={{ maxHeight: 800, overflow: 'auto' }}>
            <Table
              columns={[
                {
                  title: '软件名称',
                  dataIndex: 'roleName',
                  key: 'roleName',
                  width: 200,
                },
                {
                  title: '变量内容',
                  key: 'roleVarContent',
                  render: (_, record) => {
                    if (!record.roleVarContent?.length) return '-';
                    return renderRoleVarContent(record.roleVarContent);
                  },
                },
              ]}
              dataSource={roles}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </div>
        ),
        modal: {
          title: '软件详情',
          width: 800,
        },
        showAll: true,
      }}
    />
  );
}
