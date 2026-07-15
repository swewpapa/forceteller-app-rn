import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { AnchorRect, PopoverPlacement } from './popover-position';

export type PopoverEntry = {
  id: string;
  rect: AnchorRect;
  message: string;
  placement: PopoverPlacement;
  onDismiss?: () => void;
};

type Registry = {
  entry: PopoverEntry | null;
  register: (e: PopoverEntry) => void;
  unregister: (id: string) => void;
};

const Ctx = createContext<Registry | null>(null);

export function PopoverProvider({ children }: PropsWithChildren) {
  const [entry, setEntry] = useState<PopoverEntry | null>(null);
  const register = useCallback((e: PopoverEntry) => setEntry(e), []);
  const unregister = useCallback((id: string) => setEntry((p) => (p?.id === id ? null : p)), []);
  const value = useMemo(() => ({ entry, register, unregister }), [entry, register, unregister]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePopoverRegistry(): Registry {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('Popover must be used within PopoverProvider (ScreenContainer)');
  return ctx;
}
