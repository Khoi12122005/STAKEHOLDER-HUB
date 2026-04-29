"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearSession, getStoredUser, setSession } from "@/lib/api";
import type { LoginResult, Role, User } from "@/types/api";

type AuthContextValue = {
  user: User | null;
  isReady: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { name: string; email: string; password: string; role: Role }) => Promise<void>;
  logout: () => void;
  setAuthResult: (result: LoginResult) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setIsReady(true);
  }, []);

  const setAuthResult = (result: LoginResult) => {
    setSession(result);
    setUser(result.user);
  };

  const logout = () => {
    clearSession();
    setUser(null);
    router.replace("/login");
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      login: async (input) => {
        const result = await api.login(input);
        setAuthResult(result);
        router.replace("/dashboard");
      },
      register: async (input) => {
        const result = await api.register(input);
        setAuthResult(result);
        router.replace("/dashboard");
      },
      logout,
      setAuthResult
    }),
    [isReady, router, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
