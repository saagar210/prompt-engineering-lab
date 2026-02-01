"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface ShortcutHelpDialogProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: "⌘ + S", description: "Save current prompt" },
  { keys: "⌘ + N", description: "Create new prompt" },
  { keys: "⌘ + K", description: "Focus search" },
  { keys: "⌘ + /", description: "Show keyboard shortcuts" },
];

export default function ShortcutHelpDialog({ open, onClose }: ShortcutHelpDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">Keyboard Shortcuts</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Shortcut</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shortcuts.map((s) => (
                <TableRow key={s.keys}>
                  <TableCell>
                    <Chip label={s.keys} size="small" variant="outlined" sx={{ fontFamily: "monospace" }} />
                  </TableCell>
                  <TableCell>{s.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
}
