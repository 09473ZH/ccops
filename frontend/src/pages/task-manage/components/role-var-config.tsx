import { Button, Input, Row, Col, FormInstance, Form } from 'antd';
import React, { useCallback, useEffect, useMemo, memo } from 'react';

import { RevisionItem } from '@/api/services/softwareService';
import { Iconify } from '@/components/icon';
import MonacoEditor from '@/components/monaco-editor';
import ShowTooltip from '@/components/show-tooltip';
import { useGetActiveRoleRevision } from '@/hooks/useRoleRevisions';
import FileTable from '@/pages/file-manage/file-table';
import { formatDateTime, formatTimeAgo } from '@/utils/format-time';

interface RoleVarConfigProps {
  form: FormInstance;
  role: {
    id: number;
    name: string;
  };
}

const VarConfig = memo(({ fields }: { fields: any[] }) => (
  <div className="space-y-2">
    {fields.map((field) => (
      <Row gutter={12} key={field.key} className="items-center">
        <Col span={11}>
          <Form.Item {...field} name={[field.name, 'key']} label="变量名" noStyle>
            <Input disabled size="small" placeholder="变量名" />
          </Form.Item>
        </Col>
        <Col span={11}>
          <Form.Item {...field} name={[field.name, 'value']} noStyle>
            <Input size="small" placeholder="请输入变量值" />
          </Form.Item>
        </Col>
      </Row>
    ))}
  </div>
));

const VersionContent = memo(({ content }: { content: string }) => (
  <div className="h-[280px] overflow-auto rounded border border-gray-200 dark:border-gray-700">
    <MonacoEditor
      value={content}
      language="yaml"
      options={{
        readOnly: true,
        scrollBeyondLastLine: false,
        fontSize: 12,
        automaticLayout: true,
        wordWrap: 'on',
        minimap: { enabled: false },
      }}
    />
  </div>
));

export function RoleVarConfig({ role, form }: RoleVarConfigProps) {
  const { data: revision } = useGetActiveRoleRevision(role.id) as {
    data: RevisionItem | undefined;
  };

  const { hasVars, variables } = useMemo(() => {
    if (!revision?.taskContent) {
      return { hasVars: false, variables: [] };
    }

    try {
      const regex = /\{\{\s*([^{}]+?)\s*\}\}/g;
      const matches = Array.from(revision.taskContent.matchAll(regex));
      const uniqueVariables = new Set(matches.map((match) => match[1].trim()));
      const vars = Array.from(uniqueVariables).map((varName) => ({
        key: varName,
        value: '',
      }));

      return { hasVars: vars.length > 0, variables: vars };
    } catch (error) {
      console.error('解析变量失败:', error);
      return { hasVars: false, variables: [] };
    }
  }, [revision?.taskContent]);

  const setFormVars = useCallback(() => {
    if (variables.length > 0) {
      form.setFieldValue(['vars', role.id], variables);
    }
  }, [form, variables, role.id]);

  useEffect(() => {
    setFormVars();
  }, [setFormVars]);

  const [localVersionVisible, setLocalVersionVisible] = React.useState(false);
  const toggleVersion = useCallback(() => {
    setLocalVersionVisible((prev) => !prev);
  }, []);

  const TimeInfo = useMemo(
    () =>
      revision && (
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <span className="mr-1">更新于:</span>
            <ShowTooltip
              content={
                <div className="flex items-center gap-1">
                  {formatTimeAgo(revision.updatedAt)}
                  <Iconify icon="solar:info-circle-outline" />
                </div>
              }
              tooltipContent={formatDateTime(revision.updatedAt)}
            />
          </div>
          {revision.changeLog && (
            <div className="flex items-center">
              <span className="mr-1">变更日志:</span>
              <span>
                <ShowTooltip maxWidth={300} content={revision.changeLog} />
              </span>
            </div>
          )}
        </div>
      ),
    [revision],
  );

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span className="font-medium">{role.name}</span>
          {TimeInfo}
        </div>
        <Button
          type="link"
          size="small"
          onClick={toggleVersion}
          icon={
            <Iconify
              icon={localVersionVisible ? 'solar:minimize-square-outline' : 'solar:eye-outline'}
              className="mr-1"
            />
          }
        >
          {localVersionVisible ? '收起' : '发布内容'}
        </Button>
      </div>

      {(hasVars || localVersionVisible) && (
        <div className="space-y-4 p-3">
          {hasVars && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Iconify icon="solar:settings-outline" className="text-gray-500" />
                <span className="font-medium">变量配置</span>
              </div>
              <Form.List name={['vars', role.id]}>
                {(fields) => <VarConfig fields={fields} />}
              </Form.List>
            </div>
          )}

          {revision && localVersionVisible && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Iconify icon="solar:document-text-outline" className="text-gray-500" />
                <span className="font-medium">版本内容</span>
              </div>
              <VersionContent content={revision.taskContent} />
            </div>
          )}

          {revision && revision?.files.length > 0 && localVersionVisible && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Iconify icon="solar:folder-outline" className="text-gray-500" />
                <span className="font-medium">版本文件</span>
              </div>
              <FileTable
                fileList={revision.files}
                showDelete={false}
                showDownload={false}
                showEdit={false}
                compact
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
