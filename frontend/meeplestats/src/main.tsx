import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mantine/core/styles.css";
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import "./globals.css";
import IndexPage from "./pages/IndexPage.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
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
import GamesPage from "./pages/GamesPage.tsx";
import MatchUtilityPage from "./pages/MatchUtilityPage.tsx";
import RulebooksPage from "./pages/RulebooksPage.tsx";
import RulebookChatPage from "./pages/RulebookChatPage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import ScoreSheetCreator from "./pages/ScoreSheetCreator.tsx";
import ScoreSheet from "./pages/ScoreSheet.tsx";

const theme = createTheme({
  fontFamily: '"Host Grotesk", sans-serif',
  headings: {
    fontFamily: '"Host Grotesk", sans-serif',
    fontWeight: '600',
  },
  components: {
    Text: {
      defaultProps: {
        ff: '"Host Grotesk", sans-serif',
      },
    },
    Title: {
      defaultProps: {
        ff: '"Host Grotesk", sans-serif',
      },
    },
  }
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    id: "root",
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <IndexPage />
          </ProtectedRoute>
        ),
        id: "home"
      },
      {
        path: "/login",
        element: <LoginPage />,
        loader: LoginPageLoader,
        id: "login"
      },
      {
        path: "/register",
        element: <RegisterPage />,
        id: "register"
      },
      {
        path: "/logmatch",
        element: <LogMatchPage />,
        id: "logmatch"
      },
      {
        path: "/wishlist",
        element: <Wishlist />,
        id: "wishlist"
      },
      {
        path: "/matchHistory",
        element: <MatchHistoryPage />,
        id: "matchHistory"
      },
      {
        path: "/gameCollection",
        element: <GamesPage />,
        id: "gameCollection"
      },
      {
        path: "/matchUtility",
        element: <MatchUtilityPage />,
        id: "matchUtility"
      },
      {
        path: "/rulebooks",
        element: <RulebooksPage />,
      },
      {
        path: "/rulebook-chat",
        element: (
          <ProtectedRoute>
            <RulebookChatPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/rulebook-chat/:rulebook_id",
        element: (
          <ProtectedRoute>
            <RulebookChatPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/create-scoresheet",
        element: <ScoreSheetCreator />,
      },
      {
        path: "/scoreSheet",
        element: <ScoreSheet />

      },
      {
        path: "*",
        element: <NotFoundPage />,
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
