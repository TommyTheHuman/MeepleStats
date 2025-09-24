import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { ReactNode } from "react";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import { useTranslation } from "react-i18next";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const checkAuth = async () => {
      try {

        const requestOptions: RequestInit = {
          method: "GET",
        };
        // Check the JWT_STORAGE value and set credentials or headers accordingly
        if (JWT_STORAGE === "cookie") {
          requestOptions.credentials = "include";
        } else if (JWT_STORAGE === "localstorage") {
          requestOptions.headers = {
            Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
          };
        }

        const response = await fetch(`${API_URL}/check-auth`, requestOptions);

        const data = await response.json();
        setIsAuthenticated(data.authenticated);
      } catch (error) {
        console.error("Auth check failed", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div>{t("Loading", { defaultValue: "Loading..." })}</div>; // Avoid flickering
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;