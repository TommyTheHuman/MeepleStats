import { useEffect, useState } from "react";
import { AuthContext, AuthStatus } from "./AuthContext";
import { Constants } from "../model/Constants";

const AuthProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const [authStatus, setAuthStatus] = useState("Initial" as AuthStatus);

  useEffect(() => {
    //TODO: better way to check if user is logged in
    const loggedIn = localStorage.getItem(Constants.loggedIn) === "true";
    setAuthStatus(loggedIn ? "LoggedIn" : "Anonymous");
  }, []);

  const context = { authStatus, setAuthStatus };

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>;
}

export default AuthProvider;