import React from 'react';
import { Toaster } from 'sonner';
import styled from 'styled-components';

import Iconify from '@/components/Icon/Iconify';
import { useSettings } from '@/store/setting';

export default function Toast() {
  const { themeMode } = useSettings();

  return (
    <ToasterStyleWrapper>
      <Toaster
        position="top-center"
        theme={themeMode}
        toastOptions={{
          duration: 3000,
          classNames: {
            toast: 'rounded-lg border-0',
            description: 'text-xs text-current/60',
            content: 'flex-1 ml-2.5',
            success: 'toast-success',
            error: 'toast-error',
            warning: 'toast-warning',
            info: 'toast-info',
          },
          style: {
            background:
              themeMode === 'dark' ? 'rgba(33, 33, 33, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            boxShadow:
              themeMode === 'dark'
                ? '0 8px 24px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.15)'
                : '0 8px 24px rgba(140, 149, 159, 0.15), 0 2px 4px rgba(93, 100, 110, 0.1)',
            backdropFilter: 'blur(6px)',
          },
        }}
        icons={{
          success: (
            <Iconify icon="carbon:checkmark-filled" size={20} color="rgba(76, 175, 80, 0.9)" />
          ),
          error: (
            <Iconify icon="carbon:warning-hex-filled" size={20} color="rgba(255, 86, 48, 0.9)" />
          ),
          warning: (
            <Iconify icon="carbon:warning-alt-filled" size={20} color="rgba(255, 171, 0, 0.9)" />
          ),
          info: (
            <Iconify icon="carbon:information-filled" size={20} color="rgba(0, 184, 217, 0.9)" />
          ),
          loading: (
            <Iconify
              icon="svg-spinners:6-dots-scale-middle"
              size={20}
              className="text-gray-400/80"
            />
          ),
        }}
      />
    </ToasterStyleWrapper>
  );
}

const ToasterStyleWrapper = styled.div`
  [data-sonner-toast] {
    font-weight: 500;
    font-size: 13px;
    padding: 12px 14px;
    max-width: 380px;
    z-index: 100000;
    animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &.toast-success {
      border-left: 2px solid rgba(76, 175, 80, 0.8) !important;
    }

    &.toast-error {
      border-left: 2px solid rgba(255, 86, 48, 0.8) !important;
    }

    &.toast-warning {
      border-left: 2px solid rgba(255, 171, 0, 0.8) !important;
    }

    &.toast-info {
      border-left: 2px solid rgba(0, 184, 217, 0.8) !important;
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
