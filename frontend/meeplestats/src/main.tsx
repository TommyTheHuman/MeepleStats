import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mantine/core/styles.css";
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import IndexPage from "./pages/IndexPage.tsx";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { createTheme, MantineProvider } from "@mantine/core";
import LoginPage from "./pages/LoginPage.tsx";
import Layout from "./components/Layout.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import AuthProvider from "./components/AuthProvider.tsx";
import { LoginPageLoader } from "./pages/LoginPageLoader.ts";
import LogMatchPage from "./pages/LogMatchPage.tsx";
import Wishlist from "./pages/WishListPage.tsx";
import MatchHistoryPage from "./pages/MatchHistoryPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

const theme = createTheme({});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <IndexPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/login",
        element: <LoginPage />,
        loader: LoginPageLoader,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
      {
        path: "/logmatch",
        element: <LogMatchPage />,
      },
      {
        path: "/wishlist",
        element: <Wishlist />,
      },
      {
        path: "/matchHistory",
        element: <MatchHistoryPage />,
      },
      {
        path: "*", // Aggiungi questa route catch-all
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications />
      <ModalsProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ModalsProvider>
    </MantineProvider>
  </StrictMode>
);
