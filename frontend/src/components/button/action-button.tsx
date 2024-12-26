import { Icon } from '@iconify/react';

import IconButton from '@/components/icon/icon-button';
import ShowTooltip from '@/components/show-tooltip';

import { IconMap } from '#/icon';
import type { ButtonProps } from 'antd';

interface ActionButtonProps extends Omit<ButtonProps, 'icon'> {
  icon: keyof typeof IconMap.action;
  size?: 'large' | 'middle' | 'small';
  tooltip?: string;
}

export default function ActionButton({
  icon,
  type = 'text',
  className = '',
  size = 'middle',
  color,
  tooltip,
  disabled,
  onClick,
  ...props
}: ActionButtonProps) {
  const iconSize = {
    large: 20,
    middle: 18,
    small: 16,
  }[size];

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      return;
    }
    onClick?.(e as React.MouseEvent<HTMLElement>);
  };

  const button = (
    <div
      className={`inline-flex items-center gap-1 ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      }`}
    >
      <IconButton
        {...props}
        disabled={disabled}
        size={size}
        className={className}
        type={type}
        onClick={handleClick}
      >
        <Icon
          icon={IconMap.action[icon]}
          width={iconSize}
          height={iconSize}
          color={props.danger ? '#df4949' : color}
        />
      </IconButton>
      {props.children}
    </div>
  );

  if (tooltip) {
    return <ShowTooltip content={button} tooltipContent={tooltip} />;
  }

  return button;
}
