import { createContext, useContext } from "react";

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  logout: async () => {},
  refetchUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContext.Provider value={{ user: null, isLoading: false, logout: async () => {}, refetchUser: () => {} }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
