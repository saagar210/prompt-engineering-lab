"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import MonacoWrapper from "./MonacoWrapper";
import TagManager from "@/components/TagManager/TagManager";
import ResponsePanel from "@/components/ResponsePanel/ResponsePanel";
import VersionDiff from "@/components/VersionDiff/VersionDiff";
import ScreenshotUpload from "@/components/ScreenshotUpload/ScreenshotUpload";
import ModelRunner from "@/components/ModelRunner/ModelRunner";
import TestCasePanel from "@/components/TestCases/TestCasePanel";
import { extractVariables } from "@/lib/templateUtils";

const CATEGORIES = [
  "General",
  "Code Generation",
  "Analysis",
  "Creative Writing",
  "Data Extraction",
  "Summarization",
  "Translation",
  "Other",
];

interface Version {
  id: string;
  content: string;
  systemPrompt: string | null;
  versionNumber: number;
  changeNote: string | null;
  createdAt: string;
}

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

interface PromptData {
  id: string;
  title: string;
  content: string;
  systemPrompt: string | null;
  category: string | null;
  notes: string | null;
  isFavorite: boolean;
  tags: { id: string; tag: string }[];
  responses: Response[];
  versions: Version[];
}

interface PromptEditorPageProps {
  initialData?: PromptData;
  isNew?: boolean;
}

export default function PromptEditorPage({ initialData, isNew }: PromptEditorPageProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [systemPrompt, setSystemPrompt] = useState(initialData?.systemPrompt || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [isFavorite, setIsFavorite] = useState(initialData?.isFavorite || false);
  const [tags, setTags] = useState<string[]>(initialData?.tags.map((t) => t.tag) || []);
  const [responses, setResponses] = useState<Response[]>(initialData?.responses || []);
  const [versions, setVersions] = useState<Version[]>(initialData?.versions || []);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const variables = extractVariables(content + " " + systemPrompt);

  const handleSave = useCallback(async (changeNote?: string) => {
    if (!title.trim() || !content.trim()) {
      setSnackbar({ open: true, message: "Title and content are required", severity: "error" });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title,
        content,
        systemPrompt: systemPrompt || null,
        category: category || null,
        notes: notes || null,
        isFavorite,
        tags,
      };
      if (changeNote) payload.changeNote = changeNote;

      let res;
      if (isNew) {
        res = await fetch("/api/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/prompts/${initialData!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      setSnackbar({ open: true, message: "Saved!", severity: "success" });

      if (isNew) {
        router.push(`/prompts/${data.id}`);
      } else {
        setResponses(data.responses || responses);
        setVersions(data.versions || versions);
      }
    } catch {
      setSnackbar({ open: true, message: "Failed to save", severity: "error" });
    } finally {
      setSaving(false);
    }
  }, [title, content, systemPrompt, category, notes, isFavorite, tags, isNew, initialData, router, responses, versions]);

  // Listen for Cmd+S keyboard shortcut
  useEffect(() => {
    const handler = () => handleSave();
    window.addEventListener("promptlab:save", handler);
    return () => window.removeEventListener("promptlab:save", handler);
  }, [handleSave]);

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!window.confirm("Delete this prompt? This cannot be undone.")) return;
    await fetch(`/api/prompts/${initialData.id}`, { method: "DELETE" });
    router.push("/prompts");
  };

  const handleClone = async () => {
    if (!initialData) return;
    const res = await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title + " (Copy)",
        content,
        systemPrompt: systemPrompt || null,
        category: category || null,
        notes: notes || null,
        tags,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/prompts/${data.id}`);
    }
  };

  const handleRestore = (version: Version) => {
    setContent(version.content);
    setSystemPrompt(version.systemPrompt || "");
    handleSave(`Restored from v${version.versionNumber}`);
  };

  const refreshPrompt = useCallback(async () => {
    if (!initialData?.id) return;
    const res = await fetch(`/api/prompts/${initialData.id}`);
    const data = await res.json();
    setResponses(data.responses);
    setVersions(data.versions);
  }, [initialData?.id]);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h4">{isNew ? "New Prompt" : "Edit Prompt"}</Typography>
          {variables.length > 0 && (
            <Chip
              label={`${variables.length} {{var}}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton onClick={() => setIsFavorite(!isFavorite)} color={isFavorite ? "error" : "default"}>
            {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          {!isNew && (
            <>
              <Button startIcon={<ContentCopyIcon />} size="small" onClick={handleClone}>
                Clone
              </Button>
              <Button startIcon={<DeleteIcon />} color="error" onClick={handleDelete} size="small">
                Delete
              </Button>
            </>
          )}
          <Button
            startIcon={<SaveIcon />}
            variant="contained"
            onClick={() => handleSave()}
            disabled={saving || !title.trim() || !content.trim()}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
            />

            <MonacoWrapper
              value={content}
              onChange={setContent}
              label="Prompt Content"
              height="350px"
            />

            <TextField
              label="System Prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                sx={{ minWidth: 200 }}
                size="small"
              >
                <MenuItem value="">None</MenuItem>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
              <Box sx={{ flex: 1 }}>
                <TagManager tags={tags} onChange={setTags} />
              </Box>
            </Box>

            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              fullWidth
              size="small"
            />

            {!isNew && initialData?.id && (
              <ScreenshotUpload
                promptId={initialData.id}
                onTextExtracted={(text) => setContent((prev) => prev + "\n\n" + text)}
              />
            )}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          {!isNew && initialData?.id && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <ModelRunner
                promptId={initialData.id}
                content={content}
                systemPrompt={systemPrompt}
                onResponseGenerated={refreshPrompt}
              />
              <Divider />
              <TestCasePanel promptId={initialData.id} />
              <Divider />
              <ResponsePanel
                promptId={initialData.id}
                responses={responses}
                onResponseAdded={refreshPrompt}
              />
              <Divider />
              <VersionDiff versions={versions} onRestore={handleRestore} />
            </Box>
          )}
          {isNew && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.5 }}>
              <Typography>Save the prompt to add responses and view version history</Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
