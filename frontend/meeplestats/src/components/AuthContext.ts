import { createContext } from "react";

export type AuthStatus  = "Anonymous" | "LoggedIn";

export type AuthContextType = {
  authStatus: AuthStatus,
  setAuthStatus: (status: AuthStatus) => void,
}

export const AuthContext = createContext<AuthContextType>({
  authStatus: "Anonymous",
  setAuthStatus: () => {},
});