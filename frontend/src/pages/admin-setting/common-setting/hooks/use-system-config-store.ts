import { create } from 'zustand';

interface LoadingState {
  saveAll: boolean;
  saveGroup: boolean;
}

interface EditingState {
  id: number | null;
  key: string;
  value: string;
  description: string;
  action: 'edit' | null;
  fieldName: string | null;
}

interface SystemConfigState {
  isScrolled: boolean;
  searchText: string;
  savingFields: Set<string>;
  activeKeys: string[];
  activeAnchor: string;
  isAccordion: boolean;
  loadingState: LoadingState;
  editing: EditingState;
}

interface SystemConfigActions {
  setIsScrolled: (value: boolean) => void;
  setSearchText: (value: string) => void;
  setSavingFields: (callback: (prev: Set<string>) => Set<string>) => void;
  setActiveKeys: (value: string[]) => void;
  setActiveAnchor: (value: string) => void;
  setIsAccordion: (value: boolean) => void;
  setLoadingState: (key: keyof LoadingState, value: boolean) => void;
  setEditing: (editing: Partial<EditingState>) => void;
  resetEditing: () => void;
}

const initialEditing: EditingState = {
  id: null,
  key: '',
  value: '',
  description: '',
  action: null,
  fieldName: null,
};

const initialState: SystemConfigState = {
  isScrolled: false,
  searchText: '',
  savingFields: new Set(),
  activeKeys: ['basic-config'],
  activeAnchor: '#basic-config',
  isAccordion: false,
  loadingState: {
    saveAll: false,
    saveGroup: false,
  },
  editing: initialEditing,
};

const useSystemConfigStore = create<SystemConfigState & SystemConfigActions>((set) => ({
  ...initialState,

  setIsScrolled: (value) => set({ isScrolled: value }),

  setSearchText: (value) => set({ searchText: value }),

  setSavingFields: (callback) => set((state) => ({ savingFields: callback(state.savingFields) })),

  setActiveKeys: (value) => set({ activeKeys: value }),

  setActiveAnchor: (value) => set({ activeAnchor: value }),

  setIsAccordion: (value) => set({ isAccordion: value }),

  setLoadingState: (key, value) =>
    set((state) => ({
      loadingState: {
        ...state.loadingState,
        [key]: value,
      },
    })),

  setEditing: (editing) =>
    set((state) => ({
      editing: { ...state.editing, ...editing },
    })),

  resetEditing: () => set({ editing: initialEditing }),
}));

export default useSystemConfigStore;
