"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Alert,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { getSettings, saveSettings, type AppSettings } from "@/lib/settings";
import { useThemeMode } from "@/components/ThemeRegistry";
import ApiKeyManager from "./ApiKeyManager";

export default function SettingsPage() {
  const { setMode } = useThemeMode();
  const [settings, setSettingsState] = useState<AppSettings>({
    ollamaUrl: "http://localhost:11434",
    defaultModel: "",
    themeMode: "dark",
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  useEffect(() => {
    setSettingsState(getSettings());
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    setMode(settings.themeMode);
    setSnackbar({ open: true, message: "Settings saved" });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Settings</Typography>
        <Button startIcon={<SaveIcon />} variant="contained" onClick={handleSave}>
          Save
        </Button>
      </Box>

      <Box sx={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 3 }}>
        <Typography variant="h6">General</Typography>

        <TextField
          label="Ollama URL"
          value={settings.ollamaUrl}
          onChange={(e) => setSettingsState({ ...settings, ollamaUrl: e.target.value })}
          fullWidth
          size="small"
          helperText="Base URL for local Ollama instance"
        />

        <TextField
          label="Default Model"
          value={settings.defaultModel}
          onChange={(e) => setSettingsState({ ...settings, defaultModel: e.target.value })}
          fullWidth
          size="small"
          helperText="Auto-selected model for new runs (e.g. llama3.2)"
        />

        <FormControl size="small">
          <InputLabel>Theme</InputLabel>
          <Select
            value={settings.themeMode}
            label="Theme"
            onChange={(e) =>
              setSettingsState({
                ...settings,
                themeMode: e.target.value as AppSettings["themeMode"],
              })
            }
          >
            <MenuItem value="dark">Dark</MenuItem>
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="system">System</MenuItem>
          </Select>
        </FormControl>

        <Divider sx={{ my: 1 }} />

        <Typography variant="h6">API Keys</Typography>
        <ApiKeyManager />
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity="success" onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
