import type { Metadata } from "next";
import { Box } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry";
import Navigation, { DRAWER_WIDTH } from "@/components/Navigation/Navigation";
import KeyboardShortcuts from "@/components/KeyboardShortcuts/KeyboardShortcuts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Engineering Lab",
  description: "A workspace for designing, testing, and refining AI prompts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <KeyboardShortcuts />
          <Box sx={{ display: "flex", minHeight: "100vh" }}>
            <Navigation />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: 3,
                width: `calc(100% - ${DRAWER_WIDTH}px)`,
                bgcolor: "background.default",
              }}
            >
              {children}
            </Box>
          </Box>
        </ThemeRegistry>
      </body>
    </html>
  );
}
