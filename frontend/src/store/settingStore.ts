import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { StorageEnum, ThemeColorPresets, ThemeLayout, ThemeMode } from '#/enum';

type SettingsType = {
  themeColorPresets: ThemeColorPresets;
  themeMode: ThemeMode;
  themeLayout: ThemeLayout;
  themeStretch: boolean;
  breadCrumb: boolean;
  darkSidebar: boolean;
};

type SettingStore = {
  settings: SettingsType;
  actions: {
    setSettings: (settings: SettingsType) => void;
    clearSettings: () => void;
  };
};

const useSettingStore = create<SettingStore>()(
  persist(
    (set) => ({
      settings: {
        themeColorPresets: ThemeColorPresets.Default,
        themeMode: ThemeMode.Light,
        themeLayout: ThemeLayout.Vertical,
        themeStretch: false,
        breadCrumb: true,
        darkSidebar: false,
      },
      actions: {
        setSettings: (settings) => {
          set({ settings });
        },
        clearSettings() {
          useSettingStore.persist.clearStorage();
        },
      },
    }),
    {
      name: StorageEnum.Settings,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ [StorageEnum.Settings]: state.settings }),
    },
  ),
);

export const useSettings = () => useSettingStore((state) => state.settings);
export const useSettingActions = () => useSettingStore((state) => state.actions);
