'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  Chip,
  Grid,
} from '@mui/material';
import { History as HistoryIcon, Clear as ClearIcon } from '@mui/icons-material';
import { updateColdCallScoreAction } from '@/app/(app)/classes/[classId]/actions';

interface Student {
  id: string;
  name: string;
  uni: string;
}

interface ColdCall {
  id: string;
  calledAt: Date;
  score: number | null;
  notes: string | null;
  student: Student;
}

interface HistoryTabProps {
  coldCalls: ColdCall[];
}

const scoreOptions = [-2, -1, 0, 1, 2];

const getScoreColor = (score: number): 'error' | 'warning' | 'success' => {
  if (score < 0) return 'error';
  if (score === 0) return 'warning';
  return 'success';
};

export function HistoryTab({ coldCalls }: HistoryTabProps) {
  // Local state for scores - initialized from props
  const [localScores, setLocalScores] = useState<Record<string, number | null>>(() => {
    const initial: Record<string, number | null> = {};
    coldCalls.forEach(call => {
      initial[call.id] = call.score;
    });
    return initial;
  });

  // Track pending changes that need to be saved
  const pendingChanges = useRef<Record<string, number | null>>({});

  // Save pending changes to server
  const savePendingChanges = useCallback(async () => {
    const changes = { ...pendingChanges.current };
    pendingChanges.current = {};

    for (const [coldCallId, score] of Object.entries(changes)) {
      const result = await updateColdCallScoreAction(coldCallId, score);
      if (result.error) {
        console.error('Error updating score:', result.error);
      }
    }
  }, []);

  // Save changes when component unmounts or tab changes
  useEffect(() => {
    return () => {
      if (Object.keys(pendingChanges.current).length > 0) {
        savePendingChanges();
      }
    };
  }, [savePendingChanges]);

  // Also save on visibility change (when user switches tabs/windows)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && Object.keys(pendingChanges.current).length > 0) {
        savePendingChanges();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [savePendingChanges]);

  const handleScoreChange = (coldCallId: string, score: number | null) => {
    // Update local state immediately
    setLocalScores(prev => ({ ...prev, [coldCallId]: score }));

    // Track the change for later saving
    pendingChanges.current[coldCallId] = score;

    // Debounce save - save after 2 seconds of no activity
    const timeoutId = setTimeout(() => {
      savePendingChanges();
    }, 2000);

    return () => clearTimeout(timeoutId);
  };

  if (coldCalls.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No cold calls yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Use the slot machine to select a student!
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Cold Call History
        </Typography>
        <Chip
          label={`${coldCalls.length} total`}
          size="small"
          sx={{ ml: 2 }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {coldCalls.map((call) => {
          const currentScore = localScores[call.id] ?? null;

          return (
            <Paper
              key={call.id}
              elevation={1}
              sx={{
                p: 3,
                '&:hover': { bgcolor: 'action.hover' },
                transition: 'background-color 0.2s',
              }}
            >
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h6" component="span">
                      {call.student.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {call.student.uni}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(call.calledAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: { md: 'flex-end' } }}>
                    <Typography variant="body2" fontWeight="medium" color="text.secondary">
                      Score:
                    </Typography>
                    <ButtonGroup size="small" variant="outlined">
                      {scoreOptions.map((scoreValue) => (
                        <Button
                          key={scoreValue}
                          onClick={() => handleScoreChange(call.id, scoreValue)}
                          variant={currentScore === scoreValue ? 'contained' : 'outlined'}
                          color={currentScore === scoreValue ? getScoreColor(scoreValue) : 'inherit'}
                          sx={{ minWidth: 45 }}
                        >
                          {scoreValue >= 0 ? '+' : ''}{scoreValue}
                        </Button>
                      ))}
                    </ButtonGroup>
                    <Button
                      size="small"
                      variant={currentScore === null ? 'contained' : 'outlined'}
                      color="inherit"
                      onClick={() => handleScoreChange(call.id, null)}
                      startIcon={<ClearIcon />}
                    >
                      Clear
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
