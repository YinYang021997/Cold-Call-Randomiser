'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Casino as CasinoIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import { spinSlotMachineAction } from '@/app/(app)/classes/[classId]/actions';

interface Student {
  id: string;
  name: string;
  uni: string;
}

interface PresentationViewProps {
  classId: string;
  className: string;
  students: Student[];
}

export function PresentationView({ classId, className, students }: PresentationViewProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const router = useRouter();
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate grid columns based on number of students - optimized for large display
  const getGridColumns = useCallback(() => {
    const count = students.length;
    if (count <= 6) return 3;
    if (count <= 12) return 4;
    if (count <= 20) return 5;
    if (count <= 30) return 6;
    if (count <= 42) return 7;
    if (count <= 56) return 8;
    if (count <= 72) return 9;
    return 10;
  }, [students.length]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleSpin = async () => {
    if (isSpinning || students.length === 0) return;

    setError('');
    setSelectedStudent(null);
    setIsSpinning(true);

    try {
      // Start the random cell-hopping animation
      let hopCount = 0;
      const totalHops = 30 + Math.floor(Math.random() * 20);
      let currentDelay = 50;

      const animateHop = () => {
        const randomIndex = Math.floor(Math.random() * students.length);
        setHighlightedIndex(randomIndex);
        hopCount++;

        if (hopCount > totalHops * 0.6) {
          currentDelay += 20;
        }
        if (hopCount > totalHops * 0.8) {
          currentDelay += 40;
        }

        if (hopCount < totalHops) {
          animationRef.current = setTimeout(animateHop, currentDelay);
        }
      };

      animateHop();

      const result = await spinSlotMachineAction(classId);

      if (result.error) {
        setError(result.error);
        setIsSpinning(false);
        setHighlightedIndex(null);
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }
        return;
      }

      if (!result.student) {
        setError('Failed to select a student');
        setIsSpinning(false);
        setHighlightedIndex(null);
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }
        return;
      }

      const selectedIndex = students.findIndex(s => s.id === result.student!.id);

      setTimeout(() => {
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }

        let finalHops = 0;
        const maxFinalHops = 5;
        let finalDelay = 200;

        const finalAnimation = () => {
          if (finalHops < maxFinalHops) {
            const randomIdx = Math.floor(Math.random() * students.length);
            setHighlightedIndex(randomIdx);
            finalHops++;
            finalDelay += 100;
            animationRef.current = setTimeout(finalAnimation, finalDelay);
          } else {
            setHighlightedIndex(selectedIndex);
            setSelectedStudent(result.student!);
            setIsSpinning(false);

            // Big confetti for presentation mode
            confetti({
              particleCount: 200,
              spread: 120,
              origin: { y: 0.6 },
            });

            setTimeout(() => {
              confetti({
                particleCount: 100,
                angle: 60,
                spread: 80,
                origin: { x: 0 },
              });
              confetti({
                particleCount: 100,
                angle: 120,
                spread: 80,
                origin: { x: 1 },
              });
            }, 300);

            setTimeout(() => {
              router.refresh();
            }, 2000);
          }
        };

        finalAnimation();
      }, totalHops * 60);

    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsSpinning(false);
      setHighlightedIndex(null);
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    }
  };

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    router.push(`/classes/${classId}`);
  };

  const gridColumns = getGridColumns();

  return (
    <Box
      ref={containerRef}
      sx={{
        minHeight: '100vh',
        width: '100vw',
        bgcolor: '#1a1a2e',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      {/* Top Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Typography variant="h5" fontWeight="bold" color="white">
          {className}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
          <IconButton onClick={handleExit} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Winner Banner - Large and Prominent */}
      {selectedStudent && (
        <Box
          sx={{
            mx: 3,
            mt: 2,
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(76, 175, 80, 0.5)',
            animation: 'pulse 1.5s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.02)' },
            },
          }}
        >
          <Typography variant="h2" fontWeight="bold" color="white" sx={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            🎉 {selectedStudent.name} 🎉
          </Typography>
          <Typography variant="h5" color="rgba(255,255,255,0.9)" sx={{ mt: 1 }}>
            {selectedStudent.uni}
          </Typography>
        </Box>
      )}

      {/* Student Grid - Main Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
            gap: 1.5,
            flex: 1,
            alignContent: 'center',
          }}
        >
          {students.map((student, idx) => {
            const isHighlighted = highlightedIndex === idx && isSpinning;
            const isSelected = selectedStudent?.id === student.id;

            return (
              <Paper
                key={student.id}
                elevation={isHighlighted || isSelected ? 12 : 2}
                sx={{
                  py: students.length > 50 ? 1.5 : 2,
                  px: 2,
                  textAlign: 'center',
                  borderRadius: 2,
                  transition: 'all 0.08s ease-in-out',
                  transform: isHighlighted || isSelected ? 'scale(1.05)' : 'scale(1)',
                  bgcolor: isSelected
                    ? '#4caf50'
                    : isHighlighted
                    ? '#1976d2'
                    : 'rgba(255,255,255,0.95)',
                  color: isSelected || isHighlighted ? 'white' : '#1a1a2e',
                  border: isSelected
                    ? '3px solid #81c784'
                    : isHighlighted
                    ? '3px solid #64b5f6'
                    : '2px solid transparent',
                  boxShadow: isSelected
                    ? '0 0 30px rgba(76, 175, 80, 0.7)'
                    : isHighlighted
                    ? '0 0 20px rgba(25, 118, 210, 0.6)'
                    : '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <Typography
                  fontWeight={isSelected ? 'bold' : 'medium'}
                  sx={{
                    fontSize: students.length > 60 ? '0.9rem' : students.length > 40 ? '1rem' : students.length > 20 ? '1.1rem' : '1.2rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {student.name}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Box>

      {/* Bottom Bar with Spin Button */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 3,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          bgcolor: 'rgba(0,0,0,0.2)',
        }}
      >
        <Typography variant="body1" color="rgba(255,255,255,0.7)">
          {students.length} students
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={handleSpin}
          disabled={isSpinning || students.length === 0}
          sx={{
            px: 8,
            py: 2,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
            boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #ff8e53 0%, #ff6b6b 100%)',
              boxShadow: '0 6px 30px rgba(255, 107, 107, 0.6)',
            },
            '&:disabled': {
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
            },
          }}
          startIcon={isSpinning ? <CircularProgress size={28} color="inherit" /> : <CasinoIcon sx={{ fontSize: 32 }} />}
        >
          {isSpinning ? 'Spinning...' : 'SPIN'}
        </Button>

        <Typography variant="body1" color="rgba(255,255,255,0.7)">
          Press F11 for fullscreen
        </Typography>
      </Box>
    </Box>
  );
}
