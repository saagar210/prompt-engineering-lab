"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

interface ApiKeyEntry {
  id: string;
  provider: string;
  label: string;
  maskedKey: string;
  createdAt: string;
}

const PROVIDERS = ["openai", "anthropic"];

export default function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ provider: "openai", label: "", key: "" });

  const loadKeys = useCallback(async () => {
    const res = await fetch("/api/api-keys");
    if (res.ok) setKeys(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleAdd = async () => {
    await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ provider: "openai", label: "", key: "" });
    setDialogOpen(false);
    loadKeys();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this API key?")) return;
    await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    loadKeys();
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle2">Stored API Keys</Typography>
        <Button startIcon={<AddIcon />} size="small" variant="outlined" onClick={() => setDialogOpen(true)}>
          Add Key
        </Button>
      </Box>

      <Stack spacing={1}>
        {loading && [0, 1].map((i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "background.default",
              px: 2,
              py: 1,
              borderRadius: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Skeleton variant="rounded" width={60} height={24} />
              <Skeleton variant="text" width={100} />
              <Skeleton variant="text" width={120} />
            </Box>
            <Skeleton variant="circular" width={28} height={28} />
          </Box>
        ))}
        {!loading && keys.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No API keys stored. Add one to use cloud providers.
          </Typography>
        )}
        {!loading && keys.map((k) => (
          <Box
            key={k.id}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "background.default",
              px: 2,
              py: 1,
              borderRadius: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Chip label={k.provider} size="small" color="primary" variant="outlined" />
              <Typography variant="body2">{k.label}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                {k.maskedKey}
              </Typography>
            </Box>
            <IconButton size="small" color="error" onClick={() => handleDelete(k.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add API Key</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Provider"
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              size="small"
            >
              {PROVIDERS.map((p) => (
                <MenuItem key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              size="small"
              placeholder="e.g. Production key"
            />
            <TextField
              label="API Key"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              size="small"
              type="password"
              placeholder="sk-..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={!form.label.trim() || !form.key.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
