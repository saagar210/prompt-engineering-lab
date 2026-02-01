"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

interface BatchResult {
  testCaseName: string;
  output: string;
  expectedOutput: string | null;
  passed: boolean | null;
  executionTime: number | null;
}

interface BatchRunDialogProps {
  open: boolean;
  onClose: () => void;
  promptId: string;
  onComplete: () => void;
}

export default function BatchRunDialog({ open, onClose, promptId, onComplete }: BatchRunDialogProps) {
  const [providerTab, setProviderTab] = useState(0);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BatchResult[]>([]);

  const providers = ["ollama", "openai", "anthropic"];
  const provider = providers[providerTab];

  useEffect(() => {
    if (open && providerTab === 0) {
      fetch("/api/ollama/models")
        .then((r) => r.json())
        .then((data) => {
          const names = data.map?.((m: { name: string }) => m.name) || [];
          setOllamaModels(names);
          if (names.length > 0 && !selectedModel) setSelectedModel(names[0]);
        })
        .catch(() => {});
    }
  }, [open, providerTab]);

  useEffect(() => {
    if (providerTab === 1) setSelectedModel("gpt-4o-mini");
    else if (providerTab === 2) setSelectedModel("claude-3-5-haiku-20241022");
  }, [providerTab]);

  const handleRun = async () => {
    setRunning(true);
    setResults([]);
    try {
      const res = await fetch("/api/test-cases/batch-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, model: selectedModel, provider }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        onComplete();
      }
    } catch {
      // error handled silently
    } finally {
      setRunning(false);
    }
  };

  const modelOptions = () => {
    if (providerTab === 0) return ollamaModels;
    if (providerTab === 1) return ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini"];
    return ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022", "claude-3-5-sonnet-20241022", "claude-3-opus-20240229"];
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Batch Run Test Cases</DialogTitle>
      <DialogContent>
        <Tabs value={providerTab} onChange={(_e, v) => setProviderTab(v)} sx={{ mb: 2 }}>
          <Tab label="Ollama" />
          <Tab label="OpenAI" />
          <Tab label="Anthropic" />
        </Tabs>

        <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Model</InputLabel>
            <Select
              value={selectedModel}
              label="Model"
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {modelOptions().map((m) => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={running ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleRun}
            disabled={running || !selectedModel}
          >
            {running ? "Running..." : "Run All"}
          </Button>
        </Box>

        {results.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Test Case</TableCell>
                  <TableCell>Output</TableCell>
                  <TableCell>Expected</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.testCaseName}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ maxWidth: 200, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.output}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ maxWidth: 150, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.expectedOutput || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {r.passed === null ? (
                        <Chip label="N/A" size="small" variant="outlined" />
                      ) : r.passed ? (
                        <Chip label="Pass" size="small" color="success" />
                      ) : (
                        <Chip label="Fail" size="small" color="error" />
                      )}
                    </TableCell>
                    <TableCell>
                      {r.executionTime != null ? `${r.executionTime.toFixed(1)}s` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}
