import { Button, Spin, App, Input, Alert, Select, Drawer } from 'antd';
import { useEffect } from 'react';

import SparkWandIcon from '@/components/Icon/SparkWandIcon';
import MonacoEditor from '@/components/MonacoEditor';
import { useFileList } from '@/hooks/use-file-list';
import FileTable from '@/pages/file-manage/FileTable';
import { parseRole } from '@/utils/ansible';

import {
  useConfigEditStore,
  useRevisionOperations,
  useDraftRoleRevision,
  useActiveRoleRevision,
  useAiConfig,
} from '../use-software';

interface ConfigProps {
  id: number;
  onConfigRelease: (revisionId: number) => void;
}

function EmptyConfig({ loading }: { loading?: boolean }) {
  if (loading) {
    return (
      <div className="bg-gray-50 flex h-[300px] flex-col items-center justify-center">
        <Spin />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex h-[300px] flex-col items-center justify-center">
      <div className="mt-4 text-center">
        <div className="mt-1 text-sm text-gray-500">请输入需求描述并点击&quot;生成配置&quot;</div>
      </div>
    </div>
  );
}

function Config({ id, onConfigRelease }: ConfigProps) {
  const {
    code,
    fileIds,
    userPrompt,
    configExplanation,
    generatedConfig,
    isDrawerOpen,
    showAlert,
    actions,
  } = useConfigEditStore();

  const { list: fileList, isLoading: fileListLoading } = useFileList();
  const { data: draftRevision, isLoading: isDraftLoading } = useDraftRoleRevision(id);
  const { data: activeRevision, isLoading: isActiveLoading } = useActiveRoleRevision(id);
  const { releaseRevision, reviseRole } = useRevisionOperations();
  const { isLoading: isAiConfigLoading, mutateAsync: generateConfig } = useAiConfig();
  const { modal } = App.useApp();

  useEffect(() => {
    if (draftRevision) {
      actions.setCode(draftRevision.taskContent || '');
      actions.setFileIds(draftRevision.files?.map((file) => file.id) || []);
    } else if (activeRevision) {
      actions.setCode(activeRevision.taskContent || '');
      actions.setFileIds(activeRevision.files?.map((file) => file.id) || []);
    }
  }, [draftRevision, activeRevision, actions]);

  const handleSaveConfig = () => {
    if (!draftRevision) return;

    try {
      const parsedContent = parseRole(code);
      const isAllCopyTasks = parsedContent.every((task: any) => task.module === 'copy');

      if (!isAllCopyTasks) {
        reviseRole({
          id: draftRevision.id,
          taskContent: code,
          filesList: fileIds,
        }).catch(() => {});
        return;
      }

      const copyTasks = parsedContent;
      const referencedSrcFiles = copyTasks.map((task: any) => task.module_args.src);
      const selectedFileNames = fileList
        ?.filter((file) => fileIds.includes(file.id))
        .map((file) => file.fileName);

      const unreferencedFiles = selectedFileNames?.filter(
        (fileName) => !referencedSrcFiles.includes(fileName),
      );
      const invalidSrcFiles = referencedSrcFiles.filter(
        (srcFile: string) => !selectedFileNames?.includes(srcFile),
      );

      if (invalidSrcFiles.length > 0) {
        modal.error({
          title: '配置中引用了不存在的文件',
          content: `请检查文件名是否正确或添加到下发文中：${invalidSrcFiles.join(', ')}`,
        });
        return;
      }

      if (unreferencedFiles && unreferencedFiles.length > 0) {
        modal.error({
          title: '以下文件在配置中未被引用',
          content: `请在配置中引用或从下发文件中移除：${unreferencedFiles.join(', ')}`,
        });
        return;
      }

      reviseRole({
        id: draftRevision.id,
        taskContent: code,
        filesList: fileIds,
      }).catch(() => {});
    } catch (error) {
      reviseRole({
        id: draftRevision.id,
        taskContent: code,
        filesList: fileIds,
      }).catch(() => {});
    }
  };

  const handleRelease = (versionId: number, changeInfo: string) => {
    releaseRevision({ id: versionId, changeLog: changeInfo }).then(() => {
      onConfigRelease(versionId);
    });
  };

  const handleFileSelectChange = (value: number[]) => {
    actions.setFileIds(value);
  };

  // 添加示例配置
  const PROMPT_EXAMPLES = [
    {
      title: '复制文件',
      prompt: '复制文件 nginx.conf 到目标主机的 /etc/nginx/ 目录下，并设置644权限',
    },
    {
      title: '创建目录',
      prompt: '在目标主机创建 /data/logs 目录，设权限为755',
    },
    {
      title: '安装软件',
      prompt: '在目标主机安装最新版本的 nginx',
    },
  ];

  const handleGenerate = async () => {
    const response = await generateConfig(userPrompt);
    actions.setGeneratedConfig(response.task_content);
    actions.setConfigExplanation(response.description);
  };

  const handleApplyConfig = () => {
    actions.setCode(generatedConfig);
    actions.setUserPrompt('');
  };

  const handleCloseDrawer = () => {
    actions.toggleDrawer(false);
    actions.setGeneratedConfig('');
    actions.setUserPrompt('');
    actions.setConfigExplanation('');
  };

  if (isDraftLoading || isActiveLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spin />
      </div>
    );
  }

  if (!draftRevision) {
    return <div className="text-red-500 mb-4">未找到配置信息</div>;
  }

  return (
    <div className="space-y-4">
      {showAlert && (
        <Alert
          message={!activeRevision ? '请先打包版本并激活后方可生效' : '当前版本非激活版本'}
          type="warning"
          showIcon
        />
      )}

      <div className="flex items-center">
        <span className="mr-4 text-gray-600">下发文件</span>
        <Select
          className="flex-1"
          mode="multiple"
          placeholder="请选择文件"
          value={fileIds}
          maxTagCount="responsive"
          onChange={handleFileSelectChange}
          options={fileList?.map((file) => ({ label: file.fileName, value: file.id }))}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center">
          <button
            onClick={() => actions.toggleDrawer(true)}
            type="button"
            className="bg-orange-50 group flex h-9 w-9 items-center justify-center rounded-full border border-orange-400/30 transition-all duration-200 ease-out hover:w-32 hover:border-orange-500 hover:bg-orange-100 dark:border-orange-400/20 dark:bg-orange-400/5 dark:hover:border-orange-400/40 dark:hover:bg-orange-400/10"
          >
            <SparkWandIcon className="h-4 w-4 animate-magic-sparkle text-orange-500 transition-all duration-200 ease-out group-hover:rotate-12 group-hover:scale-110 dark:text-orange-300" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium text-orange-600 transition-all duration-200 ease-out group-hover:ml-2 group-hover:max-w-[80px] dark:text-orange-300">
              AI 配置助手
            </span>
          </button>
        </div>

        <div className="rounded border border-gray-200">
          <MonacoEditor
            height="400px"
            language="yaml"
            value={code}
            onChange={(value) => actions.setCode(value || '')}
          />
        </div>
      </div>

      <Drawer
        title="AI 配置助手"
        placement="right"
        width={600}
        onClose={handleCloseDrawer}
        open={isDrawerOpen}
        styles={{
          body: { padding: '24px' },
        }}
      >
        <div className="space-y-6">
          <div>
            <div className="mb-4">
              <span className="text-gray-600">配置需求描述</span>
            </div>
            <Input.TextArea
              rows={4}
              value={userPrompt}
              onChange={(e) => actions.setUserPrompt(e.target.value)}
              placeholder="例如复制文件 example.conf 到目标主机的 /etc/example/ 目录下"
            />

            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {PROMPT_EXAMPLES.map((example) => (
                  <Button
                    key={example.title}
                    size="small"
                    onClick={() => actions.setUserPrompt(example.prompt)}
                  >
                    {example.title}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type="primary"
                onClick={handleGenerate}
                loading={isAiConfigLoading}
                disabled={!userPrompt.trim()}
              >
                生成配置
              </Button>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-gray-600">生成的配置</span>
              <div className="flex gap-2">
                {generatedConfig && (
                  <>
                    <Button
                      size="small"
                      onClick={() => {
                        actions.setGeneratedConfig('');
                        actions.setConfigExplanation('');
                      }}
                    >
                      清空
                    </Button>
                    <Button type="primary" size="small" onClick={handleApplyConfig}>
                      应用此配置
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="rounded border border-gray-200">
              {!generatedConfig && <EmptyConfig loading={isAiConfigLoading} />}
              {generatedConfig && (
                <div className="opacity-100 transition-opacity duration-300">
                  <MonacoEditor
                    height="300px"
                    language="yaml"
                    value={generatedConfig}
                    onChange={(value) => actions.setGeneratedConfig(value || '')}
                  />
                </div>
              )}
            </div>
          </div>

          {configExplanation && (
            <div>
              <div className="mb-4">
                <span className="text-gray-600">配置说明</span>
              </div>
              <div className="rounded border border-gray-200 p-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                  {configExplanation}
                </div>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      <div className="flex justify-end gap-3">
        <Button type="primary" onClick={handleSaveConfig}>
          保存配置
        </Button>
        <Button
          onClick={() => {
            let changeInfo = '';
            modal.confirm({
              title: '确认打包',
              content: (
                <div className="py-2">
                  <Input.TextArea
                    rows={4}
                    placeholder="请输入更新信息"
                    onChange={(e) => {
                      changeInfo = e.target.value;
                    }}
                  />
                </div>
              ),
              onOk: () => {
                if (draftRevision?.id) {
                  handleRelease(draftRevision.id, changeInfo);
                }
              },
              okText: '确认',
              cancelText: '取消',
            });
          }}
          type="primary"
        >
          打包最新版本
        </Button>
      </div>

      <div>
        <div className="mb-2">
          <span className="text-gray-600">已选文件列表</span>
        </div>
        <FileTable
          fileList={fileList?.filter((file) => fileIds.includes(file.id))}
          isLoading={fileListLoading}
          showDownload={false}
          showDelete={false}
          showEdit={false}
        />
      </div>
    </div>
  );
}

export default Config;
