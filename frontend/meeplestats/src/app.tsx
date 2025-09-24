import { useState } from "react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import AuthProvider from "./components/AuthProvider";
import { router } from "./router";
import { theme } from "./theme";
import { RouterProvider } from "react-router";
import { ThemeContext } from "./ThemeContext";
import './i18n';

const App = () => {
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("dark");

  const toggleColorScheme = (value?: "light" | "dark") =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleColorScheme }}>
      <MantineProvider
        theme={{ ...theme }}
        forceColorScheme={colorScheme}
        defaultColorScheme="dark"
      >
        <Notifications />
        <ModalsProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ModalsProvider>
      </MantineProvider>
    </ThemeContext.Provider>
  );
};

export default App;