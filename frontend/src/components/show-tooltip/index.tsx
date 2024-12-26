import { Tooltip } from 'antd';
import React, { useRef, useState, useEffect } from 'react';

import type { TooltipProps } from 'antd';

interface ShowTooltipProps extends Omit<TooltipProps, 'title'> {
  content: React.ReactNode;
  tooltipContent?: React.ReactNode;
  maxWidth?: number;
}

export default function ShowTooltip({
  content,
  tooltipContent,
  color = 'rgba(0, 0, 0, 0.65)',
  maxWidth,
  ...props
}: ShowTooltipProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);

  useEffect(() => {
    if (divRef.current) {
      setIsOverflow(divRef.current.scrollWidth > divRef.current.offsetWidth);
    }
  }, [content]);

  const shouldShowTooltip = tooltipContent || isOverflow;

  return (
    <Tooltip
      title={shouldShowTooltip ? tooltipContent || content : null}
      color={color}
      overlayInnerStyle={{
        padding: '6px 12px',
        fontSize: '13px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
      }}
      {...props}
    >
      <div className="flex items-center">
        <div
          ref={divRef}
          className="truncate"
          style={{ maxWidth: maxWidth != null ? `${maxWidth}px` : undefined }}
        >
          {content}
        </div>
      </div>
    </Tooltip>
  );
}
