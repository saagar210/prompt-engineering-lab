"use client";

import { useState, useRef, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

interface ProviderTabProps {
  provider: "ollama" | "openai" | "anthropic";
  promptId: string;
  content: string;
  systemPrompt: string;
  onResponseGenerated: () => void;
  defaultModel?: string;
}

export default function ProviderTab({
  provider,
  promptId,
  content,
  systemPrompt,
  onResponseGenerated,
  defaultModel,
}: ProviderTabProps) {
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState(defaultModel || "");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url =
      provider === "ollama"
        ? "/api/ollama/models"
        : `/api/${provider}/models`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        const names: string[] =
          provider === "ollama"
            ? data.map((m: { name: string }) => m.name)
            : data.models || data;
        setModels(names);
        setAvailable(true);
        if (names.length > 0 && !selectedModel) {
          setSelectedModel(
            defaultModel && names.includes(defaultModel)
              ? defaultModel
              : names[0]
          );
        }
      })
      .catch(() => setAvailable(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  // Auto-scroll streaming box to bottom
  useEffect(() => {
    if (streamBoxRef.current) {
      streamBoxRef.current.scrollTop = streamBoxRef.current.scrollHeight;
    }
  }, [streamingText]);

  const handleRun = async () => {
    if (!selectedModel || !content.trim()) return;
    setRunning(true);
    setError(null);
    setElapsed(0);
    setStreamingText("");

    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed((Date.now() - start) / 1000);
    }, 100);

    try {
      const url =
        provider === "ollama"
          ? "/api/ollama/generate"
          : `/api/${provider}/generate`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId,
          model: selectedModel,
          content,
          systemPrompt: systemPrompt || undefined,
          stream: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      if (!res.body) {
        throw new Error("No response body for streaming");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            if (data.token) {
              setStreamingText((prev) => (prev || "") + data.token);
            }
            if (data.done) {
              // Stream complete, response saved on server
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== jsonStr) throw e;
          }
        }
      }

      onResponseGenerated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setRunning(false);
      setStreamingText(null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  if (available === false) {
    return (
      <Alert severity="info" sx={{ py: 0.5 }}>
        {provider === "ollama"
          ? "Ollama not available — start Ollama to enable local models"
          : `No API key configured for ${provider}. Add one in Settings.`}
      </Alert>
    );
  }

  if (available === null) return null;

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel>Model</InputLabel>
          <Select
            value={selectedModel}
            label="Model"
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={running}
          >
            {models.map((m) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={running ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
          onClick={handleRun}
          disabled={running || !selectedModel || !content.trim()}
          size="small"
        >
          {running ? `${elapsed.toFixed(1)}s` : "Run"}
        </Button>
      </Box>

      {streamingText !== null && streamingText.length > 0 && (
        <Box
          ref={streamBoxRef}
          sx={{
            mt: 1.5,
            p: 1.5,
            bgcolor: "background.default",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            maxHeight: 200,
            overflow: "auto",
            fontFamily: "monospace",
            fontSize: "0.8rem",
            whiteSpace: "pre-wrap",
          }}
        >
          <Typography variant="body2" component="span" sx={{ fontFamily: "inherit", fontSize: "inherit" }}>
            {streamingText}
          </Typography>
          <Box
            component="span"
            sx={{
              display: "inline-block",
              width: 2,
              height: "1em",
              bgcolor: "primary.main",
              ml: 0.25,
              verticalAlign: "text-bottom",
              animation: "blink 1s step-end infinite",
              "@keyframes blink": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0 },
              },
            }}
          />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
