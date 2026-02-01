"use client";

import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Chip,
  Stack,
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { format } from "date-fns";

interface Version {
  id: string;
  content: string;
  systemPrompt: string | null;
  versionNumber: number;
  changeNote: string | null;
  createdAt: string;
}

interface VersionDiffProps {
  versions: Version[];
  onRestore?: (version: Version) => void;
}

export default function VersionDiff({ versions, onRestore }: VersionDiffProps) {
  const [leftVersion, setLeftVersion] = useState<string>(versions[1]?.id || "");
  const [rightVersion, setRightVersion] = useState<string>(versions[0]?.id || "");

  const leftData = versions.find((v) => v.id === leftVersion);
  const rightData = versions.find((v) => v.id === rightVersion);

  if (versions.length === 0) {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Version History
        </Typography>
        <Typography color="text.secondary">No versions yet</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Version History ({versions.length})
      </Typography>

      {versions.length === 1 ? (
        <Stack spacing={1}>
          <Chip
            label={`v${versions[0].versionNumber} - ${format(new Date(versions[0].createdAt), "MMM d, yyyy HH:mm")}`}
            size="small"
          />
          {versions[0].changeNote && (
            <Typography variant="caption" color="text.secondary">
              {versions[0].changeNote}
            </Typography>
          )}
        </Stack>
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Left</InputLabel>
              <Select
                value={leftVersion}
                label="Left"
                onChange={(e) => setLeftVersion(e.target.value)}
              >
                {versions.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    v{v.versionNumber} - {format(new Date(v.createdAt), "MMM d HH:mm")}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Right</InputLabel>
              <Select
                value={rightVersion}
                label="Right"
                onChange={(e) => setRightVersion(e.target.value)}
              >
                {versions.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    v{v.versionNumber} - {format(new Date(v.createdAt), "MMM d HH:mm")}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {leftData && rightData && (
            <>
              <Box
                sx={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 1,
                  overflow: "auto",
                  maxHeight: 400,
                  "& pre": { fontSize: "12px !important" },
                }}
              >
                <ReactDiffViewer
                  oldValue={leftData.content}
                  newValue={rightData.content}
                  splitView={false}
                  compareMethod={DiffMethod.WORDS}
                  useDarkTheme
                  leftTitle={`v${leftData.versionNumber}`}
                  rightTitle={`v${rightData.versionNumber}`}
                />
              </Box>

              {onRestore && rightData && (
                <Box sx={{ mt: 1.5 }}>
                  <Button
                    size="small"
                    startIcon={<RestoreIcon />}
                    variant="outlined"
                    onClick={() => onRestore(rightData)}
                  >
                    Restore v{rightData.versionNumber}
                  </Button>
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
}
