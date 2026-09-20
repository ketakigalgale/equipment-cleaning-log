import { createContext, ReactNode, useContext, useState } from "react";

const STORAGE_KEY = "ecl.actor";
const DEFAULT_ACTOR = "Unknown User";

interface ActorContextValue {
  actor: string;
  setActor: (value: string) => void;
}

const ActorContext = createContext<ActorContextValue | undefined>(undefined);

function readStoredActor(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_ACTOR;
  } catch {
    return DEFAULT_ACTOR;
  }
}

export function ActorProvider({ children }: { children: ReactNode }) {
  const [actor, setActorState] = useState<string>(readStoredActor);

  const setActor = (value: string) => {
    const trimmed = value.trim() || DEFAULT_ACTOR;
    setActorState(trimmed);
    try {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
    }
  };

  return <ActorContext.Provider value={{ actor, setActor }}>{children}</ActorContext.Provider>;
}

export function useActor(): ActorContextValue {
  const ctx = useContext(ActorContext);
  if (!ctx) throw new Error("useActor must be used within an ActorProvider");
  return ctx;
}
