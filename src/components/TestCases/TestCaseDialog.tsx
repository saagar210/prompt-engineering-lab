"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

interface TestCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; variables: Record<string, string>; expectedOutput: string }) => void;
  initial?: {
    name: string;
    variables: Record<string, string>;
    expectedOutput: string;
  };
}

export default function TestCaseDialog({ open, onClose, onSave, initial }: TestCaseDialogProps) {
  const [name, setName] = useState("");
  const [pairs, setPairs] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }]);
  const [expectedOutput, setExpectedOutput] = useState("");

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      const entries = Object.entries(initial.variables);
      setPairs(entries.length > 0 ? entries.map(([key, value]) => ({ key, value })) : [{ key: "", value: "" }]);
      setExpectedOutput(initial.expectedOutput || "");
    } else {
      setName("");
      setPairs([{ key: "", value: "" }]);
      setExpectedOutput("");
    }
  }, [initial, open]);

  const addPair = () => setPairs([...pairs, { key: "", value: "" }]);
  const removePair = (i: number) => setPairs(pairs.filter((_, idx) => idx !== i));
  const updatePair = (i: number, field: "key" | "value", val: string) => {
    const updated = [...pairs];
    updated[i][field] = val;
    setPairs(updated);
  };

  const handleSave = () => {
    const variables: Record<string, string> = {};
    pairs.forEach((p) => {
      if (p.key.trim()) variables[p.key.trim()] = p.value;
    });
    onSave({ name, variables, expectedOutput });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? "Edit Test Case" : "New Test Case"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
            required
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Variables
            </Typography>
            {pairs.map((p, i) => (
              <Box key={i} sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField
                  placeholder="Variable name"
                  value={p.key}
                  onChange={(e) => updatePair(i, "key", e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <TextField
                  placeholder="Value"
                  value={p.value}
                  onChange={(e) => updatePair(i, "value", e.target.value)}
                  size="small"
                  sx={{ flex: 2 }}
                />
                {pairs.length > 1 && (
                  <IconButton size="small" onClick={() => removePair(i)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
            <Button size="small" startIcon={<AddIcon />} onClick={addPair}>
              Add Variable
            </Button>
          </Box>

          <TextField
            label="Expected Output (optional)"
            value={expectedOutput}
            onChange={(e) => setExpectedOutput(e.target.value)}
            multiline
            rows={3}
            size="small"
            fullWidth
            helperText="If provided, test results will be compared against this"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
