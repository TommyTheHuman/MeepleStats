import { useContext } from "react";
import { Navigate } from "react-router";
import { AuthContext } from "./AuthContext";

const ProtectedRoute = ({ children }) => {
  const { authStatus } = useContext(AuthContext);
  return authStatus === "LoggedIn" ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;