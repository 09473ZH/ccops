import { create } from 'zustand';

/**
 * 客户端状态
 */

export interface EditingState {
  id: number | null;
  name: string;
  hostServerUrl: string;
  action: 'edit' | null;
}

interface LabelAssignState {
  hostId: number | null;
  selectedLabels: number[];
}

interface HostState {
  editing: EditingState;
  labelAssign: LabelAssignState;
}

interface HostStore extends HostState {
  setEditing: (editing: Partial<EditingState>) => void;
  resetEditing: () => void;
  setLabelAssign: (labelAssign: Partial<LabelAssignState>) => void;
  resetLabelAssign: () => void;
}

const initialState: HostState = {
  editing: {
    id: null,
    name: '',
    hostServerUrl: '',
    action: null,
  },
  labelAssign: {
    hostId: null,
    selectedLabels: [],
  },
};

export const useHostStore = create<HostStore>((set) => ({
  editing: initialState.editing,
  labelAssign: initialState.labelAssign,

  setEditing: (editing) =>
    set((state) => ({
      editing: { ...state.editing, ...editing },
    })),

  resetEditing: () => set({ editing: initialState.editing }),

  setLabelAssign: (labelAssign) =>
    set((state) => ({
      labelAssign: { ...state.labelAssign, ...labelAssign },
    })),

  resetLabelAssign: () => set({ labelAssign: initialState.labelAssign }),
}));
