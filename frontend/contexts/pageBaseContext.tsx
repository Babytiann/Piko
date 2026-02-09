import { createContext, useContext, type ReactNode, type FC } from "react";

export function createSafeContext<T>(displayName: string) {
  const Context = createContext<T | null>(null);
  Context.displayName = displayName;

  const useCtx = () => {
    const ctx = useContext(Context);
    if (ctx === null) {
      throw new Error(`use${displayName} must be used within ${displayName}Provider`);
    }
    return ctx;
  };

  const ContextProvider: FC<{ value: T; children: ReactNode }> = ({ value, children }) => (
    <Context.Provider value={value}>{children}</Context.Provider>
  );

  return [ContextProvider, useCtx] as const;
}