import { Button, Drawer, Form, FormInstance, Input, Select, Space, Row, Col } from 'antd';
import React, { useMemo } from 'react';

import { PlaybookTaskReq } from '@/api/services/task';
import HostSelector from '@/components/HostSelector';
import { useHostList } from '@/hooks/use-host-list';
import { useRoleList } from '@/pages/software-manage/use-software';

import { generateTaskName } from '../utils';

import { RoleVarConfig } from './RoleVarConfig';

interface CreateTaskModalProps {
  open: boolean;
  isRestarting?: boolean;
  onClose: () => void;
  onSubmit: (values: PlaybookTaskReq) => void;
  form: FormInstance;
}

export function CreateTaskModal({
  open,
  isRestarting,
  onClose,
  onSubmit,
  form,
}: CreateTaskModalProps) {
  const { list: roleList } = useRoleList();
  const { list: hostList } = useHostList();
  const roleIdList = Form.useWatch('roleIdList', form);
  const generatedTaskName = useMemo(
    () => generateTaskName(roleIdList || [], roleList),
    [roleIdList, roleList],
  );

  const handleSubmit = (values: any) => {
    const vars = Object.entries(values.vars || {})
      .filter(([_, content]) => Array.isArray(content) && content.length > 0)
      .map(([roleId, content]) => ({
        roleId: Number(roleId),
        content: (content as Array<{ key: string; value: string }>)
          .filter((v) => v.key && v.value)
          .map((v) => ({
            key: v.key.trim(),
            value: v.value.trim(),
          })),
      }))
      .filter((item) => item.content.length > 0);

    const submitData: PlaybookTaskReq = {
      ...values,
      type: 'playbook' as const,
      vars,
      taskName: values.taskName || generatedTaskName,
    };
    onSubmit(submitData);
  };

  return (
    <Drawer
      title={isRestarting ? '重启任务' : '新建任务'}
      width={800}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={() => form?.submit()}>
            {isRestarting ? '重启' : '创建'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="hostIdList"
              label="主机列表"
              rules={[{ required: true, message: '请选择主机' }]}
            >
              <HostSelector hostList={hostList} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="roleIdList"
              label="软件列表"
              rules={[{ required: true, message: '请选择软件' }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择软件"
                options={roleList.map((role) => ({
                  label: role.existActiveRevision
                    ? role.name
                    : `${role.name}（请先激活版本后使用）`,
                  value: role.id,
                  disabled: !role.existActiveRevision,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16} align="middle">
          <Col span={24}>
            <Form.Item label="任务名称">
              <div className="flex items-center gap-4">
                <Form.Item name="taskName" className="mb-0 flex-1" noStyle>
                  <Input placeholder={generatedTaskName || '请输入任务名称'} />
                </Form.Item>
              </div>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          shouldUpdate={(prevValues, curValues) => prevValues?.roleIdList !== curValues?.roleIdList}
        >
          {({ getFieldValue }) => {
            const roleIdList = getFieldValue('roleIdList') || [];
            return roleIdList.length > 0 ? (
              <div className="space-y-4">
                {roleIdList.map((roleId: number) => {
                  const role = roleList.find((r) => r.id === roleId);
                  if (!role) return null;

                  return <RoleVarConfig key={role.id} role={role} form={form} />;
                })}
              </div>
            ) : (
              <div className="rounded-lg border py-12 text-center text-gray-500">
                请先在基本信息中选择软件
              </div>
            );
          }}
        </Form.Item>
      </Form>
    </Drawer>
  );
}
