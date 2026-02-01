"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Rating,
  TextField,
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CodeIcon from "@mui/icons-material/Code";
import ArticleIcon from "@mui/icons-material/Article";
import { formatDistanceToNow } from "date-fns";
import MarkdownRenderer from "@/components/MarkdownRenderer/MarkdownRenderer";

interface Response {
  id: string;
  modelName: string;
  content: string;
  tokenCount: number | null;
  executionTime: number | null;
  source: string;
  rating: number | null;
  notes: string | null;
  createdAt: string;
}

interface ResponsePanelProps {
  promptId: string;
  responses: Response[];
  onResponseAdded: () => void;
}

export default function ResponsePanel({
  promptId,
  responses,
  onResponseAdded,
}: ResponsePanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [renderModes, setRenderModes] = useState<Record<string, "raw" | "markdown">>({});
  const [form, setForm] = useState({
    modelName: "",
    content: "",
    tokenCount: "",
    executionTime: "",
    rating: 0,
    notes: "",
  });

  const getMode = (id: string) => renderModes[id] || "raw";
  const toggleMode = (id: string, mode: "raw" | "markdown") => {
    if (mode !== null) setRenderModes((prev) => ({ ...prev, [id]: mode }));
  };

  const handleSubmit = async () => {
    await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        promptId,
        modelName: form.modelName,
        content: form.content,
        tokenCount: form.tokenCount ? parseInt(form.tokenCount) : null,
        executionTime: form.executionTime ? parseFloat(form.executionTime) : null,
        rating: form.rating || null,
        notes: form.notes || null,
        source: "manual",
      }),
    });
    setForm({ modelName: "", content: "", tokenCount: "", executionTime: "", rating: 0, notes: "" });
    setDialogOpen(false);
    onResponseAdded();
  };

  const handleRatingChange = async (responseId: string, newRating: number | null) => {
    await fetch(`/api/responses/${responseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: newRating }),
    });
    onResponseAdded();
  };

  const handleDelete = async (responseId: string) => {
    if (!window.confirm("Delete this response?")) return;
    await fetch(`/api/responses/${responseId}`, { method: "DELETE" });
    onResponseAdded();
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Responses ({responses.length})</Typography>
        <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => setDialogOpen(true)}>
          Add Response
        </Button>
      </Box>

      <Stack spacing={2}>
        {responses.map((r) => (
          <Card key={r.id} variant="outlined">
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="subtitle2">{r.modelName}</Typography>
                  <Chip label={r.source} size="small" variant="outlined" />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <ToggleButtonGroup
                    value={getMode(r.id)}
                    exclusive
                    onChange={(_e, v) => toggleMode(r.id, v)}
                    size="small"
                    sx={{ "& .MuiToggleButton-root": { py: 0.25, px: 0.75 } }}
                  >
                    <ToggleButton value="raw" title="Raw text">
                      <CodeIcon sx={{ fontSize: 16 }} />
                    </ToggleButton>
                    <ToggleButton value="markdown" title="Markdown">
                      <ArticleIcon sx={{ fontSize: 16 }} />
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <IconButton size="small" onClick={() => handleDelete(r.id)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {getMode(r.id) === "raw" ? (
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: "pre-wrap",
                    bgcolor: "background.default",
                    p: 1.5,
                    borderRadius: 1,
                    mb: 1,
                    maxHeight: 200,
                    overflow: "auto",
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                  }}
                >
                  {r.content}
                </Typography>
              ) : (
                <Box
                  sx={{
                    bgcolor: "background.default",
                    p: 1.5,
                    borderRadius: 1,
                    mb: 1,
                    maxHeight: 200,
                    overflow: "auto",
                  }}
                >
                  <MarkdownRenderer content={r.content} />
                </Box>
              )}

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Rating
                    value={r.rating}
                    onChange={(_e, v) => handleRatingChange(r.id, v)}
                    size="small"
                  />
                  {r.tokenCount && (
                    <Typography variant="caption" color="text.secondary">
                      {r.tokenCount} tokens
                    </Typography>
                  )}
                  {r.executionTime && (
                    <Typography variant="caption" color="text.secondary">
                      {r.executionTime.toFixed(1)}s
                    </Typography>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                </Typography>
              </Box>
              {r.notes && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block", fontStyle: "italic" }}>
                  {r.notes}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Response</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Model Name"
              value={form.modelName}
              onChange={(e) => setForm({ ...form, modelName: e.target.value })}
              placeholder="e.g., GPT-4, Claude 3.5 Sonnet"
              size="small"
              required
            />
            <TextField
              label="Response Content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              multiline
              rows={8}
              required
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Token Count"
                value={form.tokenCount}
                onChange={(e) => setForm({ ...form, tokenCount: e.target.value })}
                type="number"
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Execution Time (s)"
                value={form.executionTime}
                onChange={(e) => setForm({ ...form, executionTime: e.target.value })}
                type="number"
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Rating
              </Typography>
              <Rating
                value={form.rating}
                onChange={(_e, v) => setForm({ ...form, rating: v || 0 })}
              />
            </Box>
            <TextField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              multiline
              rows={2}
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!form.modelName || !form.content}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
