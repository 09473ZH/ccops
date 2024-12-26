import { useCallback, useState } from 'react';

interface UseModalsControlProps {
  modals: string[];
  initialState?: Record<string, boolean>;
}

export function useModalsControl({ modals, initialState = {} }: UseModalsControlProps) {
  const [modalStates, setModalStates] = useState<Record<string, boolean>>(() =>
    modals.reduce(
      (acc, modalName) => ({
        ...acc,
        [modalName]: initialState[modalName] ?? false,
      }),
      {},
    ),
  );

  const open = useCallback((modalName: string) => {
    setModalStates((prev) => ({ ...prev, [modalName]: true }));
  }, []);

  const close = useCallback((modalName: string) => {
    setModalStates((prev) => ({ ...prev, [modalName]: false }));
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
  };
}
