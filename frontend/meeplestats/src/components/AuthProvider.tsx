import { useEffect, useState } from "react";
import { AuthContext, AuthStatus } from "./AuthContext";
import { API_URL, JWT_STORAGE } from "../model/Constants";

const AuthProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const [authStatus, setAuthStatus] = useState("Initial" as AuthStatus);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const requestOptions: RequestInit = {
          method: "GET",
        }

        if (JWT_STORAGE === "cookie") {
          requestOptions.credentials = "include";
        } else if (JWT_STORAGE === "localstorage") {
          requestOptions.headers = {
            Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
          };
        }

        const response = await fetch(`${API_URL}/check-auth`, requestOptions);
        if (response.ok) {
          setAuthStatus("LoggedIn");
        } else {
          setAuthStatus("Anonymous");
        }

      } catch (error) {
        console.error("Error checking auth status:", error);
        setAuthStatus("Anonymous");
      }
    };
    checkAuth();
  }, []);

  const context = { authStatus, setAuthStatus };

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>;
}

export default AuthProvider;