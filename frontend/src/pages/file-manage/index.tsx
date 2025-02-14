import { Button, Modal, UploadFile, App } from 'antd';
import { useState } from 'react';

import { Iconify } from '@/components/Icon';
import { Upload } from '@/components/Upload';
import { useModalsControl } from '@/hooks/use-modals-control';

import FileTable from './FileTable';
import { useFile } from './use-file';

import type { UploadChangeParam } from 'antd/lib/upload';

/**
 * 文件管理
 */
function FileManager() {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [uploadFileList, setUploadFileList] = useState<UploadFile<unknown>[]>([]);

  const { deleteFiles, uploadFiles } = useFile();
  const { modal } = App.useApp();
  const { isOpen, open, close } = useModalsControl({
    modals: ['uploadFile', 'file'],
  });

  const handleBatchDelete = () => {
    modal.confirm({
      title: `确定删除选中的 ${selectedRows.length} 个文件吗？`,
      icon: <Iconify icon="solar:danger-circle-bold" />,
      content: '此操作不可逆，请谨慎操作。',
      onOk: () => {
        deleteFiles.mutateAsync(selectedRows).then(() => {
          setSelectedRows([]);
        });
      },
    });
  };

  const handleUploadChange = ({ fileList }: UploadChangeParam<UploadFile<unknown>>) => {
    setUploadFileList(fileList);
  };

  const handleUploadModalOk = () => {
    const files = uploadFileList.map((file) => file.originFileObj as File);
    uploadFiles.mutateAsync(files).then(() => {
      close('uploadFile');
      setUploadFileList([]);
    });
  };

  return (
    <div className="flex h-full flex-col p-5">
      <div className="mb-4 flex justify-end gap-4">
        <Button
          icon={<Iconify icon="flowbite:trash-bin-outline" />}
          onClick={handleBatchDelete}
          disabled={!selectedRows.length}
          danger
        >
          批量删除
        </Button>
        <Button
          type="primary"
          icon={<Iconify icon="flowbite:upload-outline" />}
          onClick={() => open('uploadFile')}
        >
          上传文件
        </Button>
      </div>
      <FileTable selectedRows={selectedRows} onSelectChange={setSelectedRows} />
      <Modal
        title="上传文件"
        open={isOpen('uploadFile')}
        onOk={handleUploadModalOk}
        onCancel={() => {
          close('uploadFile');
          setUploadFileList([]);
        }}
        width={600}
        confirmLoading={uploadFiles.isPending}
      >
        <Upload
          fileList={uploadFileList}
          beforeUpload={() => false}
          onChange={handleUploadChange}
          multiple
        />
      </Modal>
    </div>
  );
}

export default FileManager;
