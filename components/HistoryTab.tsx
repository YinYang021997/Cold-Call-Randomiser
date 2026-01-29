'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  Grid,
} from '@mui/material';
import { History as HistoryIcon, Clear as ClearIcon, Check as CheckIcon } from '@mui/icons-material';
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

  // Track saving status for each cold call
  const [savingStatus, setSavingStatus] = useState<Record<string, 'saving' | 'saved' | null>>({});

  // Track pending changes that need to be saved
  const pendingChanges = useRef<Record<string, number | null>>({});
  const saveTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Save a single score to server
  const saveScore = useCallback(async (coldCallId: string, score: number | null) => {
    setSavingStatus(prev => ({ ...prev, [coldCallId]: 'saving' }));

    const result = await updateColdCallScoreAction(coldCallId, score);

    if (result.error) {
      console.error('Error updating score:', result.error);
      setSavingStatus(prev => ({ ...prev, [coldCallId]: null }));
    } else {
      setSavingStatus(prev => ({ ...prev, [coldCallId]: 'saved' }));
      // Clear the "saved" indicator after 2 seconds
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [coldCallId]: null }));
      }, 2000);
    }
  }, []);

  // Save pending changes to server
  const savePendingChanges = useCallback(async () => {
    const changes = { ...pendingChanges.current };
    pendingChanges.current = {};

    for (const [coldCallId, score] of Object.entries(changes)) {
      await saveScore(coldCallId, score);
    }
  }, [saveScore]);

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

    // Clear any existing timeout for this cold call
    if (saveTimeouts.current[coldCallId]) {
      clearTimeout(saveTimeouts.current[coldCallId]);
    }

    // Debounce save - save after 1.5 seconds of no activity for this item
    saveTimeouts.current[coldCallId] = setTimeout(() => {
      const scoreToSave = pendingChanges.current[coldCallId];
      if (scoreToSave !== undefined) {
        delete pendingChanges.current[coldCallId];
        saveScore(coldCallId, scoreToSave);
      }
    }, 1500);
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
                <Grid size={{ xs: 12, md: 6 }}>
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

                <Grid size={{ xs: 12, md: 6 }}>
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
                          disabled={savingStatus[call.id] === 'saving'}
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
                      disabled={savingStatus[call.id] === 'saving'}
                    >
                      Clear
                    </Button>
                    {savingStatus[call.id] === 'saving' && (
                      <CircularProgress size={16} />
                    )}
                    {savingStatus[call.id] === 'saved' && (
                      <CheckIcon color="success" sx={{ fontSize: 20 }} />
                    )}
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
