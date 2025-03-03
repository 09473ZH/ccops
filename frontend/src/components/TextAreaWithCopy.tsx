import { Input } from 'antd';
import { CSSProperties } from 'react';

import { CopyButton } from './Button';

interface TextAreaWithCopyProps {
  content: string;
  onChange?: (value: string) => void;
  minRows?: number;
  maxRows?: number;
  style?: CSSProperties;
  size?: 'small' | 'default';
}

export function TextAreaWithCopy({
  content,
  onChange,
  minRows = 3,
  maxRows = 5,
  style,
  size = 'default',
}: TextAreaWithCopyProps) {
  const textAreaStyle = {
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    lineHeight: size === 'small' ? '20px' : '28px',
    padding: size === 'small' ? '7px' : '11px',
    ...style,
  };

  return (
    <div className="relative">
      <Input.TextArea
        value={content}
        onChange={(e) => onChange?.(e.target.value)}
        autoSize={{
          minRows: size === 'small' ? 1 : minRows,
          maxRows: size === 'small' ? 1 : maxRows,
        }}
        style={textAreaStyle}
        className="bg-transparent"
      />
      <CopyButton
        className={`bg-blue-500 text-white absolute ${
          size === 'small'
            ? 'right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-1'
            : 'bottom-2 right-2 h-8 w-8 p-1.5'
        } z-[3]`}
        text={content}
      />
    </div>
  );
}
