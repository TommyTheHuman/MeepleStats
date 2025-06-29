import { createTheme } from "@mantine/core";

export const theme = createTheme({
  fontFamily: '"Host Grotesk", sans-serif',
  headings: {
    fontFamily: '"Host Grotesk", sans-serif',
    fontWeight: "600",
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
  },
});