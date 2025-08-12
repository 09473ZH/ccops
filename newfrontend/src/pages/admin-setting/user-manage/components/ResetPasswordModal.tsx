import { Form, Modal } from 'antd';
import { useTranslation } from 'react-i18next';

import { PasswordForm } from '@/components/AccountSettingModal';

import { UserInfo } from '#/entity';

interface ResetPasswordModalProps {
  open: boolean;
  onOk: (values: { password: string }) => void;
  onCancel: () => void;
  record: UserInfo;
}

export default function ResetPasswordModal({
  open,
  onOk,
  record,
  onCancel,
}: ResetPasswordModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const handleCancel = () => {
    onCancel();
    form.resetFields();
  };
  return (
    <Modal
      title={`${t('user.resetPassword')} - ${record?.username}`}
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      footer={null}
    >
      <PasswordForm form={form} onFinish={onOk} onlyReset />
    </Modal>
  );
}
