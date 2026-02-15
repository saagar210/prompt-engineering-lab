'use client';
import React, { ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              border: '1px solid #e57373',
              borderRadius: 1,
              bgcolor: '#ffebee',
            }}
          >
            <Typography color="error" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {this.state.error?.message}
            </Typography>
            <Button
              variant="contained"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </Button>
          </Box>
        )
      );
    }

    return this.props.children;
  }
}
