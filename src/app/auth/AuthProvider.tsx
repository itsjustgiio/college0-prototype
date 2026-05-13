import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { AuthUser } from "./authTypes";
import { localAuthRepository } from "../services/localAuthRepository";

interface AuthContextValue {
  user: AuthUser | null;
  signIn: (email: string, password: string) => AuthUser;
  signOut: () => void;
  changePassword: (nextPassword: string) => AuthUser;
  completeStudentTutorial: () => AuthUser;
  restoreStudentTutorial: () => AuthUser;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => localAuthRepository.getSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signIn(email, password) {
        const nextUser = localAuthRepository.signIn(email, password);
        setUser(nextUser);
        return nextUser;
      },
      signOut() {
        localAuthRepository.signOut();
        setUser(null);
      },
      changePassword(nextPassword) {
        if (!user) {
          throw new Error("No authenticated user.");
        }

        const nextUser = localAuthRepository.changePassword(user.id, nextPassword);
        setUser(nextUser);
        return nextUser;
      },
      completeStudentTutorial() {
        if (!user) {
          throw new Error("No authenticated user.");
        }

        const nextUser = localAuthRepository.completeStudentTutorial(user.id);
        setUser(nextUser);
        return nextUser;
      },
      restoreStudentTutorial() {
        if (!user) {
          throw new Error("No authenticated user.");
        }

        const nextUser = localAuthRepository.restoreStudentTutorial(user.id);
        setUser(nextUser);
        return nextUser;
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
