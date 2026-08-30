import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";

type AuthContextValue = {
  token: string | null;
  hydrated: boolean;
  setToken: (token: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("tealeaf-auth-token")
      .then((storedToken) => setToken(storedToken))
      .finally(() => setHydrated(true));
  }, []);

  function updateToken(nextToken: string | null) {
    setToken(nextToken);
    if (nextToken) {
      void AsyncStorage.setItem("tealeaf-auth-token", nextToken);
    } else {
      void AsyncStorage.removeItem("tealeaf-auth-token");
    }
  }

  return (
    <AuthContext.Provider value={{ token, hydrated, setToken: updateToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
