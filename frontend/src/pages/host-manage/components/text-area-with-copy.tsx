import { Input } from 'antd';

import { CopyButton } from '@/components/button';

interface TextAreaWithCopyProps {
  content: string;
  onChange?: (value: string) => void;
  minRows?: number;
  maxRows?: number;
}

export function TextAreaWithCopy({
  content,
  onChange,
  minRows = 3,
  maxRows = 5,
}: TextAreaWithCopyProps) {
  const textAreaStyle = {
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    lineHeight: '28px',
    padding: '11px',
  };

  return (
    <div className="relative">
      <Input.TextArea
        value={content}
        onChange={(e) => onChange?.(e.target.value)}
        autoSize={{ minRows, maxRows }}
        style={textAreaStyle}
        className="bg-transparent"
      />
      <CopyButton
        className="bg-blue-500 text-white absolute bottom-2 right-2 z-[3] h-8 w-8 p-1.5"
        text={content}
      />
    </div>
  );
}
