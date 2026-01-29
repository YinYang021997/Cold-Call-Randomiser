'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Casino as CasinoIcon, Person as PersonIcon } from '@mui/icons-material';
import { spinSlotMachineAction } from '@/app/(app)/classes/[classId]/actions';

interface Student {
  id: string;
  name: string;
  uni: string;
}

interface SlotMachineProps {
  classId: string;
  students: Student[];
}

export function SlotMachine({ classId, students }: SlotMachineProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate grid columns based on number of students to fit in viewport
  const getGridColumns = useCallback(() => {
    const count = students.length;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    if (count <= 12) return 4;
    if (count <= 20) return 5;
    if (count <= 30) return 6;
    if (count <= 42) return 7;
    return 8;
  }, [students.length]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  const handleSpin = async () => {
    if (isSpinning || students.length === 0) return;

    setError('');
    setSelectedStudent(null);
    setIsSpinning(true);

    try {
      // Start the random cell-hopping animation
      let hopCount = 0;
      const totalHops = 30 + Math.floor(Math.random() * 20); // 30-50 hops
      let currentDelay = 50; // Start fast

      const animateHop = () => {
        // Pick a random cell to highlight
        const randomIndex = Math.floor(Math.random() * students.length);
        setHighlightedIndex(randomIndex);
        hopCount++;

        // Gradually slow down
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

      // Start the animation
      animateHop();

      // Call the server action to get the selected student
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

      // Wait for animation to finish, then show the result
      const selectedIndex = students.findIndex(s => s.id === result.student!.id);

      // Final animation: hop to the selected student with a dramatic slowdown
      setTimeout(() => {
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }

        // Do a few more hops landing on the selected student
        let finalHops = 0;
        const maxFinalHops = 5;
        let finalDelay = 200;

        const finalAnimation = () => {
          if (finalHops < maxFinalHops) {
            // Randomly hop a few more times
            const randomIdx = Math.floor(Math.random() * students.length);
            setHighlightedIndex(randomIdx);
            finalHops++;
            finalDelay += 100;
            animationRef.current = setTimeout(finalAnimation, finalDelay);
          } else {
            // Land on the selected student
            setHighlightedIndex(selectedIndex);
            setSelectedStudent(result.student!);
            setIsSpinning(false);

            // Trigger confetti
            confetti({
              particleCount: 150,
              spread: 100,
              origin: { y: 0.6 },
            });

            // Extra confetti bursts
            setTimeout(() => {
              confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
              });
              confetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
              });
            }, 200);

            setTimeout(() => {
              router.refresh();
            }, 1500);
          }
        };

        finalAnimation();
      }, totalHops * 60); // Wait for initial animation to mostly complete

    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsSpinning(false);
      setHighlightedIndex(null);
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    }
  };

  if (students.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No students in this class yet
        </Typography>
      </Box>
    );
  }

  const gridColumns = getGridColumns();

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Header with Spin Button */}
      <Paper
        elevation={6}
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
          p: 2,
          borderRadius: 2,
          color: 'white',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CasinoIcon sx={{ fontSize: 28, mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              Random Student Picker
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="medium"
            onClick={handleSpin}
            disabled={isSpinning}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              px: 4,
              py: 1,
              fontSize: '1rem',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: 'grey.100',
              },
            }}
            startIcon={isSpinning ? <CircularProgress size={18} color="primary" /> : <CasinoIcon />}
          >
            {isSpinning ? 'Spinning...' : 'Spin & Pick'}
          </Button>
        </Box>
      </Paper>

      {/* Selected Student Banner */}
      {selectedStudent && (
        <Paper
          elevation={4}
          sx={{
            background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
            p: 1.5,
            borderRadius: 2,
            mb: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" fontWeight="bold" color="white">
            🎉 {selectedStudent.name} 🎉
          </Typography>
        </Paper>
      )}

      {/* Student Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          gap: 1,
        }}
      >
        {students.map((student, idx) => {
          const isHighlighted = highlightedIndex === idx && isSpinning;
          const isSelected = selectedStudent?.id === student.id;

          return (
            <Paper
              key={student.id}
              elevation={isHighlighted || isSelected ? 6 : 1}
              sx={{
                py: 1,
                px: 1.5,
                textAlign: 'center',
                borderRadius: 1.5,
                transition: 'all 0.08s ease-in-out',
                transform: isHighlighted || isSelected ? 'scale(1.03)' : 'scale(1)',
                bgcolor: isSelected
                  ? 'success.main'
                  : isHighlighted
                  ? 'primary.main'
                  : 'background.paper',
                color: isSelected || isHighlighted ? 'white' : 'text.primary',
                border: isSelected
                  ? '2px solid'
                  : isHighlighted
                  ? '2px solid'
                  : '1px solid',
                borderColor: isSelected
                  ? 'success.dark'
                  : isHighlighted
                  ? 'primary.dark'
                  : 'divider',
                boxShadow: isSelected
                  ? '0 0 15px rgba(76, 175, 80, 0.5)'
                  : isHighlighted
                  ? '0 0 10px rgba(25, 118, 210, 0.4)'
                  : undefined,
              }}
            >
              <Typography
                fontWeight={isSelected ? 'bold' : 'medium'}
                sx={{
                  fontSize: students.length > 30 ? '0.75rem' : students.length > 15 ? '0.85rem' : '0.9rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.3,
                }}
              >
                {student.name}
              </Typography>
            </Paper>
          );
        })}
      </Box>

      {/* Student Count */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1.5, display: 'block', textAlign: 'center' }}
      >
        {students.length} student{students.length !== 1 ? 's' : ''}
      </Typography>
    </Box>
  );
}
