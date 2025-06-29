import { createContext } from "react";

export const ThemeContext = createContext({
  colorScheme: "dark",
  toggleColorScheme: () => { },
});