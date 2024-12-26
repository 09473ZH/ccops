import { create } from 'zustand';

import type { GetProp, BreadcrumbProps } from 'antd';

type MenuItem = GetProp<BreadcrumbProps, 'items'>[number];

interface BreadcrumbState {
  customBreadcrumbs?: MenuItem[];
  setCustomBreadcrumbs: (items?: MenuItem[]) => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  customBreadcrumbs: undefined,
  setCustomBreadcrumbs: (items) => set({ customBreadcrumbs: items }),
}));
