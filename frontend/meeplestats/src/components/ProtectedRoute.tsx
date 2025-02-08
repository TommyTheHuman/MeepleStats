import { useContext } from "react";
import { Navigate } from "react-router";
import { AuthContext } from "./AuthContext";

import { ReactNode } from "react";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { authStatus } = useContext(AuthContext);
  return authStatus === "LoggedIn" ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;