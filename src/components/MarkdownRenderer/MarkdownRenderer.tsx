"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Box } from "@mui/material";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <Box
      sx={{
        "& h1, & h2, & h3, & h4, & h5, & h6": {
          color: "primary.main",
          mt: 2,
          mb: 1,
        },
        "& p": { mb: 1.5, lineHeight: 1.7 },
        "& code": {
          bgcolor: "rgba(255,255,255,0.06)",
          px: 0.8,
          py: 0.2,
          borderRadius: 0.5,
          fontFamily: "monospace",
          fontSize: "0.85em",
        },
        "& pre": {
          bgcolor: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 1,
          p: 2,
          overflow: "auto",
          mb: 2,
          "& code": {
            bgcolor: "transparent",
            p: 0,
          },
        },
        "& table": {
          borderCollapse: "collapse",
          width: "100%",
          mb: 2,
        },
        "& th, & td": {
          border: "1px solid rgba(255,255,255,0.15)",
          px: 1.5,
          py: 0.75,
          textAlign: "left",
        },
        "& th": {
          bgcolor: "rgba(255,255,255,0.05)",
          fontWeight: 600,
        },
        "& blockquote": {
          borderLeft: "3px solid",
          borderColor: "primary.main",
          pl: 2,
          ml: 0,
          opacity: 0.85,
        },
        "& ul, & ol": { pl: 3, mb: 1.5 },
        "& li": { mb: 0.5 },
        "& a": { color: "primary.main" },
        "& hr": {
          border: "none",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          my: 2,
        },
        "& img": { maxWidth: "100%", borderRadius: 1 },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </Box>
  );
}
