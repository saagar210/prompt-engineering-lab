"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";

interface Screenshot {
  id: string;
  imagePath: string;
  extractedText: string | null;
  createdAt: string;
}

interface ScreenshotUploadProps {
  promptId: string;
  onTextExtracted?: (text: string) => void;
}

export default function ScreenshotUpload({ promptId, onTextExtracted }: ScreenshotUploadProps) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [uploading, setUploading] = useState(false);
  const [ocrRunning, setOcrRunning] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScreenshots = useCallback(async () => {
    const res = await fetch(`/api/screenshots?promptId=${promptId}`);
    const data = await res.json();
    setScreenshots(data);
  }, [promptId]);

  useEffect(() => {
    fetchScreenshots();
  }, [fetchScreenshots]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("promptId", promptId);

      const res = await fetch("/api/screenshots", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      await fetchScreenshots();
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      uploadFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/screenshots/${id}`, { method: "DELETE" });
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

  const runOCR = async (screenshot: Screenshot) => {
    setOcrRunning(screenshot.id);
    try {
      const Tesseract = await import("tesseract.js");
      const result = await Tesseract.recognize(screenshot.imagePath, "eng");
      const text = result.data.text.trim();

      setScreenshots((prev) =>
        prev.map((s) => (s.id === screenshot.id ? { ...s, extractedText: text } : s))
      );

      if (text && onTextExtracted) {
        onTextExtracted(text);
      }
    } catch {
      setError("OCR failed");
    } finally {
      setOcrRunning(null);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Screenshots
      </Typography>

      <Box
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        sx={{
          border: "2px dashed",
          borderColor: dragOver ? "primary.main" : "divider",
          borderRadius: 1,
          p: 2,
          textAlign: "center",
          cursor: "pointer",
          bgcolor: dragOver ? "rgba(144,202,249,0.05)" : "transparent",
          transition: "all 0.2s",
          mb: 1.5,
        }}
        onClick={() => document.getElementById("screenshot-input")?.click()}
      >
        {uploading ? (
          <CircularProgress size={24} />
        ) : (
          <>
            <CloudUploadIcon sx={{ fontSize: 32, opacity: 0.5, mb: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              Drop image here or click to upload
            </Typography>
          </>
        )}
        <input
          id="screenshot-input"
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileInput}
        />
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      {screenshots.map((s) => (
        <Box
          key={s.id}
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "flex-start",
            mb: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: "rgba(255,255,255,0.03)",
          }}
        >
          <Box
            component="img"
            src={s.imagePath}
            alt="screenshot"
            sx={{ width: 60, height: 60, objectFit: "cover", borderRadius: 0.5, flexShrink: 0 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {s.extractedText ? (
              <Typography
                variant="caption"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {s.extractedText}
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                No text extracted
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <IconButton
              size="small"
              onClick={() => runOCR(s)}
              disabled={ocrRunning === s.id}
              title="Extract text (OCR)"
            >
              {ocrRunning === s.id ? <CircularProgress size={16} /> : <TextSnippetIcon fontSize="small" />}
            </IconButton>
            {s.extractedText && (
              <IconButton size="small" onClick={() => copyText(s.extractedText!)} title="Copy text">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton size="small" onClick={() => handleDelete(s.id)} color="error" title="Delete">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
