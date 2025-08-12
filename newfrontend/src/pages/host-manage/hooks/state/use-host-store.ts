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

interface AnnotationAssignState {
  hostId: number | null;
  selectedAnnotations: number[];
}

interface HostState {
  editing: EditingState;
  annotationAssign: AnnotationAssignState;
}

interface HostStore extends HostState {
  setEditing: (editing: Partial<EditingState>) => void;
  resetEditing: () => void;
  setAnnotationAssign: (annotationAssign: Partial<AnnotationAssignState>) => void;
  resetAnnotationAssign: () => void;
}

const initialState: HostState = {
  editing: {
    id: null,
    name: '',
    hostServerUrl: '',
    action: null,
  },
  annotationAssign: {
    hostId: null,
    selectedAnnotations: [],
  },
};

export const useHostStore = create<HostStore>((set) => ({
  editing: initialState.editing,
  annotationAssign: initialState.annotationAssign,

  setEditing: (editing) =>
    set((state) => ({
      editing: { ...state.editing, ...editing },
    })),

  resetEditing: () => set({ editing: initialState.editing }),

  setAnnotationAssign: (annotationAssign) =>
    set((state) => ({
      annotationAssign: { ...state.annotationAssign, ...annotationAssign },
    })),

  resetAnnotationAssign: () => set({ annotationAssign: initialState.annotationAssign }),
}));
