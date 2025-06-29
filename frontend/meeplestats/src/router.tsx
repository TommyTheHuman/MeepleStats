import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import IndexPage from "./pages/IndexPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LogMatchPage from "./pages/LogMatchPage";
import Wishlist from "./pages/WishListPage";
import MatchHistoryPage from "./pages/MatchHistoryPage";
import GamesPage from "./pages/GamesPage";
import MatchUtilityPage from "./pages/MatchUtilityPage";
import RulebooksPage from "./pages/RulebooksPage";
import RulebookChatPage from "./pages/RulebookChatPage";
import NotFoundPage from "./pages/NotFoundPage";
import ScoreSheetCreator from "./pages/ScoreSheetCreator";
import ScoreSheet from "./pages/ScoreSheet";
import ProtectedRoute from "./components/ProtectedRoute";
import { LoginPageLoader } from "./pages/LoginPageLoader";

export const router = createBrowserRouter([
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
        id: "home",
      },
      {
        path: "/login",
        element: <LoginPage />,
        loader: LoginPageLoader,
        id: "login",
      },
      {
        path: "/register",
        element: <RegisterPage />,
        id: "register",
      },
      {
        path: "/logmatch",
        element: <LogMatchPage />,
        id: "logmatch",
      },
      {
        path: "/wishlist",
        element: <Wishlist />,
        id: "wishlist",
      },
      {
        path: "/matchHistory",
        element: <MatchHistoryPage />,
        id: "matchHistory",
      },
      {
        path: "/gameCollection",
        element: <GamesPage />,
        id: "gameCollection",
      },
      {
        path: "/matchUtility",
        element: <MatchUtilityPage />,
        id: "matchUtility",
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
        element: <ScoreSheet />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);