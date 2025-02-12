import React from 'react';
import { Toaster } from 'sonner';
import styled from 'styled-components';

import { useSettings } from '@/store/setting';

export default function Toast() {
  const { themeMode } = useSettings();

  return (
    <ToasterStyleWrapper>
      <Toaster
        position="top-right"
        theme={themeMode}
        toastOptions={{
          duration: 3000,
          classNames: {
            toast: 'rounded-lg border-0',
            description: 'text-xs text-current/45',
            content: 'flex-1 ml-2',
          },
        }}
      />
    </ToasterStyleWrapper>
  );
}

const ToasterStyleWrapper = styled.div`
  [data-sonner-toast] {
    font-weight: 600;
    font-size: 14px;
  }
`;
