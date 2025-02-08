import { App } from 'antd'; // 假设使用 Ant Design
import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { IconButton, Iconify } from '../Icon';

interface CopyButtonProps {
  text: string;
  onCopy?: () => void;
  className?: string;
}

export default function CopyButton({ onCopy, text, className }: CopyButtonProps) {
  const { message } = App.useApp();
  const onCopyHandler = () => {
    message.success('Copied!');
  };
  return (
    <CopyToClipboard onCopy={onCopy || onCopyHandler} text={text}>
      <IconButton className={`text-gray ${className || ''}`}>
        <Iconify icon="eva:copy-fill" size={15} />
      </IconButton>
    </CopyToClipboard>
  );
}
