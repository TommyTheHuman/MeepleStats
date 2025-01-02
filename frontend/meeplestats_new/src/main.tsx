import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mantine/core/styles.css";
import IndexPage from "./pages/IndexPage.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import { createTheme, MantineProvider } from "@mantine/core";
import LoginPage from "./pages/LoginPage.tsx";
import Layout from "./components/Layout.tsx";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import AuthProvider from "./components/AuthProvider.tsx";
import { LoginPageLoader } from "./pages/LoginPageLoader.ts";

const theme = createTheme({});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <IndexPage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
        loader: LoginPageLoader,
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
