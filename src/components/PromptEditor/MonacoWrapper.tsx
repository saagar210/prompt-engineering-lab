"use client";

import { useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Box, Typography } from "@mui/material";

interface MonacoWrapperProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  height?: string;
  language?: string;
}

export default function MonacoWrapper({
  value,
  onChange,
  label,
  height = "300px",
  language = "markdown",
}: MonacoWrapperProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  return (
    <Box>
      {label && (
        <Typography variant="caption" sx={{ mb: 0.5, display: "block", color: "text.secondary" }}>
          {label}
        </Typography>
      )}
      <Box
        sx={{
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <Editor
          height={height}
          language={language}
          value={value}
          theme="vs-dark"
          onChange={(v) => onChange(v || "")}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            wordWrap: "on",
            scrollBeyondLastLine: false,
            padding: { top: 8, bottom: 8 },
            renderLineHighlight: "none",
          }}
        />
      </Box>
    </Box>
  );
}
