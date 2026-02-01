"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PlaylistPlayIcon from "@mui/icons-material/PlaylistPlay";
import DeleteIcon from "@mui/icons-material/Delete";
import TestCaseDialog from "./TestCaseDialog";
import BatchRunDialog from "./BatchRunDialog";

interface TestCase {
  id: string;
  name: string;
  variables: string;
  expectedOutput: string | null;
  runs?: { id: string; passed: boolean | null; modelName: string; createdAt: string }[];
}

interface TestCasePanelProps {
  promptId: string;
}

export default function TestCasePanel({ promptId }: TestCasePanelProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [editCase, setEditCase] = useState<TestCase | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const loadTestCases = useCallback(async () => {
    const res = await fetch(`/api/test-cases?promptId=${promptId}`);
    if (res.ok) setTestCases(await res.json());
  }, [promptId]);

  useEffect(() => {
    loadTestCases();
  }, [loadTestCases]);

  const handleSave = async (data: { name: string; variables: Record<string, string>; expectedOutput: string }) => {
    const payload = {
      promptId,
      name: data.name,
      variables: data.variables,
      expectedOutput: data.expectedOutput || null,
    };

    if (editCase) {
      await fetch(`/api/test-cases/${editCase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/test-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setEditCase(null);
    loadTestCases();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this test case?")) return;
    await fetch(`/api/test-cases/${id}`, { method: "DELETE" });
    loadTestCases();
  };

  const handleRun = async (id: string) => {
    setRunningId(id);
    await fetch(`/api/test-cases/${id}/run`, { method: "POST" });
    setRunningId(null);
    loadTestCases();
  };

  const getLastRunStatus = (tc: TestCase) => {
    if (!tc.runs || tc.runs.length === 0) return null;
    const last = tc.runs[0];
    if (last.passed === null) return "neutral";
    return last.passed ? "pass" : "fail";
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Test Cases ({testCases.length})</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {testCases.length > 0 && (
            <Button
              startIcon={<PlaylistPlayIcon />}
              size="small"
              variant="outlined"
              onClick={() => setBatchOpen(true)}
            >
              Batch Run
            </Button>
          )}
          <Button
            startIcon={<AddIcon />}
            size="small"
            variant="outlined"
            onClick={() => {
              setEditCase(null);
              setDialogOpen(true);
            }}
          >
            Add
          </Button>
        </Box>
      </Box>

      <Stack spacing={1}>
        {testCases.map((tc) => {
          const status = getLastRunStatus(tc);
          return (
            <Box
              key={tc.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "background.default",
                px: 2,
                py: 1,
                borderRadius: 1,
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" },
              }}
              onClick={() => {
                setEditCase(tc);
                setDialogOpen(true);
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2">{tc.name}</Typography>
                {status === "pass" && <Chip label="Pass" size="small" color="success" />}
                {status === "fail" && <Chip label="Fail" size="small" color="error" />}
                {status === "neutral" && <Chip label="Run" size="small" variant="outlined" />}
              </Box>
              <Box sx={{ display: "flex", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                <IconButton
                  size="small"
                  onClick={() => handleRun(tc.id)}
                  disabled={runningId === tc.id}
                >
                  {runningId === tc.id ? <CircularProgress size={16} /> : <PlayArrowIcon fontSize="small" />}
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(tc.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          );
        })}
      </Stack>

      <TestCaseDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditCase(null);
        }}
        onSave={handleSave}
        initial={
          editCase
            ? {
                name: editCase.name,
                variables: JSON.parse(editCase.variables || "{}"),
                expectedOutput: editCase.expectedOutput || "",
              }
            : undefined
        }
      />

      <BatchRunDialog
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        promptId={promptId}
        onComplete={loadTestCases}
      />
    </Box>
  );
}
