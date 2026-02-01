"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

interface VariableFillerProps {
  open: boolean;
  onClose: () => void;
  variables: string[];
  initialValues?: Record<string, string>;
  onFill: (values: Record<string, string>) => void;
}

export default function VariableFiller({
  open,
  onClose,
  variables,
  initialValues,
  onFill,
}: VariableFillerProps) {
  const [values, setValues] = useState<Record<string, string>>(
    initialValues || Object.fromEntries(variables.map((v) => [v, ""]))
  );

  const handleChange = (variable: string, value: string) => {
    setValues((prev) => ({ ...prev, [variable]: value }));
  };

  const handleFill = () => {
    onFill(values);
    onClose();
  };

  const allFilled = variables.every((v) => values[v]?.trim());

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Fill Template Variables</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This prompt contains {variables.length} variable{variables.length > 1 ? "s" : ""}. Provide values below.
        </Typography>
        <Stack spacing={2}>
          {variables.map((v) => (
            <TextField
              key={v}
              label={`{{${v}}}`}
              value={values[v] || ""}
              onChange={(e) => handleChange(v, e.target.value)}
              size="small"
              fullWidth
              placeholder={`Value for ${v}`}
            />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleFill} variant="contained" disabled={!allFilled}>
          Fill &amp; Run
        </Button>
      </DialogActions>
    </Dialog>
  );
}
