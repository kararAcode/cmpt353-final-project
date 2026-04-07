"use client";

import { createContext, useContext } from "react";

import type { AuthUser } from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
});

export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
