"use client";

import { createTheme, type Theme } from "@mui/material/styles";

export function createAppTheme(mode: "dark" | "light"): Theme {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#90caf9",
      },
      secondary: {
        main: "#ce93d8",
      },
      ...(mode === "dark"
        ? {
            background: {
              default: "#0a0a0a",
              paper: "#141414",
            },
          }
        : {
            background: {
              default: "#fafafa",
              paper: "#ffffff",
            },
          }),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border:
              mode === "dark"
                ? "1px solid rgba(255,255,255,0.08)"
                : "1px solid rgba(0,0,0,0.12)",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight:
              mode === "dark"
                ? "1px solid rgba(255,255,255,0.08)"
                : "1px solid rgba(0,0,0,0.12)",
          },
        },
      },
    },
  });
}

const theme = createAppTheme("dark");
export default theme;
