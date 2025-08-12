import { useCallback, useState, useRef } from 'react';

interface UseModalsControlProps<M extends string> {
  modals: M[];
  initialState?: Record<M, boolean>;
}

export function useModalsControl<T = unknown, M extends string = string>({
  modals,
  initialState = {} as Record<M, boolean>,
}: UseModalsControlProps<M>) {
  const [modalStates, setModalStates] = useState<Record<string, boolean>>(() =>
    modals.reduce(
      (acc, modalName) => ({
        ...acc,
        [modalName]: initialState[modalName] ?? false,
      }),
      {},
    ),
  );

  const [selectedItems, setSelectedItems] = useState<Record<string, T | null>>({});

  const selectedItemRef = useRef<T | null>(null);

  const open = useCallback((modalName: string, item?: T) => {
    setModalStates((prev) => ({ ...prev, [modalName]: true }));
    if (item !== undefined) {
      selectedItemRef.current = item;
    }
  }, []);

  const close = useCallback((modalName: string) => {
    setModalStates((prev) => ({ ...prev, [modalName]: false }));
    setSelectedItems((prev) => ({ ...prev, [modalName]: null }));
  }, []);

  const toggle = useCallback((modalName: string) => {
    setModalStates((prev) => ({ ...prev, [modalName]: !prev[modalName] }));
  }, []);

  const resetAll = useCallback(() => {
    setModalStates((prev) =>
      Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
    );
  }, []);

  const isOpen = useCallback((modalName: string) => modalStates[modalName] ?? false, [modalStates]);

  return {
    open,
    close,
    toggle,
    resetAll,
    isOpen,
    selectedItems,
  };
}
