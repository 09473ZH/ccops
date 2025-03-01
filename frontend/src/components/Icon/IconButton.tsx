import { ButtonProps } from 'antd';
import { CSSProperties, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
} & ButtonProps;
export default function IconButton({ children, className, style, onClick }: Props) {
  return (
    <button
      style={style}
      className={`flex cursor-pointer items-center justify-center rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
