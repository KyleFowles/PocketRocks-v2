"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef } from "react";

type BeforeNavigateFn = () => Promise<void>;

type Ctx = {
  setBeforeNavigate: (fn: BeforeNavigateFn | null) => void;
  runBeforeNavigate: () => Promise<void>;
};

const BeforeNavigateContext = createContext<Ctx | null>(null);

export function BeforeNavigateProvider(props: { children: React.ReactNode }) {
  const handlerRef = useRef<BeforeNavigateFn | null>(null);

  const setBeforeNavigate = useCallback((fn: BeforeNavigateFn | null) => {
    handlerRef.current = fn;
  }, []);

  const runBeforeNavigate = useCallback(async () => {
    const fn = handlerRef.current;
    if (!fn) return;
    await fn();
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      setBeforeNavigate,
      runBeforeNavigate,
    }),
    [setBeforeNavigate, runBeforeNavigate]
  );

  return (
    <BeforeNavigateContext.Provider value={value}>
      {props.children}
    </BeforeNavigateContext.Provider>
  );
}

export function useBeforeNavigateRegistry() {
  const ctx = useContext(BeforeNavigateContext);
  if (!ctx) {
    throw new Error("useBeforeNavigateRegistry must be used inside BeforeNavigateProvider");
  }
  return ctx.setBeforeNavigate;
}

export function useRunBeforeNavigate() {
  const ctx = useContext(BeforeNavigateContext);
  if (!ctx) {
    throw new Error("useRunBeforeNavigate must be used inside BeforeNavigateProvider");
  }
  return ctx.runBeforeNavigate;
}
