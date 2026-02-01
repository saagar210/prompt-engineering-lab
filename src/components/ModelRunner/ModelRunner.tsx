"use client";

import { useState, useEffect, useCallback } from "react";
import { Box, Tab, Tabs, Typography, Chip } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ProviderTab from "./ProviderTab";
import VariableFiller from "@/components/VariableFiller/VariableFiller";
import { extractVariables, substituteVariables } from "@/lib/templateUtils";
import { getSettings } from "@/lib/settings";

interface ModelRunnerProps {
  promptId: string;
  content: string;
  systemPrompt: string;
  onResponseGenerated: () => void;
}

export default function ModelRunner({
  promptId,
  content,
  systemPrompt,
  onResponseGenerated,
}: ModelRunnerProps) {
  const [tab, setTab] = useState(0);
  const [fillerOpen, setFillerOpen] = useState(false);
  const [resolvedContent, setResolvedContent] = useState(content);
  const [resolvedSystem, setResolvedSystem] = useState(systemPrompt);
  const [pendingProvider, setPendingProvider] = useState<number | null>(null);
  const [defaultModel, setDefaultModel] = useState("");

  const variables = extractVariables(content + " " + systemPrompt);

  useEffect(() => {
    const settings = getSettings();
    if (settings.defaultModel) setDefaultModel(settings.defaultModel);
  }, []);

  // Keep resolved content in sync when no variables
  useEffect(() => {
    if (variables.length === 0) {
      setResolvedContent(content);
      setResolvedSystem(systemPrompt);
    }
  }, [content, systemPrompt, variables.length]);

  const handleFill = useCallback(
    (values: Record<string, string>) => {
      setResolvedContent(substituteVariables(content, values));
      setResolvedSystem(substituteVariables(systemPrompt, values));
      setFillerOpen(false);
    },
    [content, systemPrompt]
  );

  const providers: ("ollama" | "openai" | "anthropic")[] = ["ollama", "openai", "anthropic"];

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <SmartToyIcon fontSize="small" />
        <Typography variant="subtitle2">Run Prompt</Typography>
        {variables.length > 0 && (
          <Chip
            label={`${variables.length} variable${variables.length > 1 ? "s" : ""}`}
            size="small"
            color="secondary"
            variant="outlined"
            onClick={() => setFillerOpen(true)}
          />
        )}
      </Box>

      <Tabs
        value={tab}
        onChange={(_e, v) => setTab(v)}
        sx={{ mb: 1.5, minHeight: 36, "& .MuiTab-root": { minHeight: 36, py: 0 } }}
      >
        <Tab label="Ollama" />
        <Tab label="OpenAI" />
        <Tab label="Anthropic" />
      </Tabs>

      <ProviderTab
        provider={providers[tab]}
        promptId={promptId}
        content={resolvedContent}
        systemPrompt={resolvedSystem}
        onResponseGenerated={onResponseGenerated}
        defaultModel={tab === 0 ? defaultModel : undefined}
      />

      <VariableFiller
        open={fillerOpen}
        onClose={() => setFillerOpen(false)}
        variables={variables}
        onFill={handleFill}
      />
    </Box>
  );
}
