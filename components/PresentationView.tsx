'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Casino as CasinoIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Group as GroupIcon,
  PlayCircle as PlayCircleIcon,
  StopCircle as StopCircleIcon,
} from '@mui/icons-material';
import { spinSlotMachineAction, spinTeamColdCallAction } from '@/app/(app)/classes/[classId]/actions';

interface Student {
  id: string;
  name: string;
  uni: string;
}

interface Team {
  id: string;
  name: string;
  color: string;
  students: Student[];
}

interface PresentationViewProps {
  classId: string;
  className: string;
  initialMode: 'individual' | 'team';
  students: Student[];
  teams: Team[];
}

type AnimationPhase = 'idle' | 'team' | 'team_pause' | 'student' | 'done';

// Returns display name: full name if short enough, otherwise first name only
function getDisplayName(name: string): string {
  if (name.length <= 15) return name;
  return name.split(' ')[0];
}

export function PresentationView({ classId, className, initialMode, students, teams }: PresentationViewProps) {
  const displayMode = initialMode; // locked to what was chosen at launch

  // ── Individual mode state ──────────────────────────────────────────────
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [testMode, setTestMode] = useState(false);

  // ── Team mode state ────────────────────────────────────────────────────
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [highlightedTeamIndex, setHighlightedTeamIndex] = useState<number | null>(null);
  const [highlightedMemberIndex, setHighlightedMemberIndex] = useState<number | null>(null);
  const [selectedMember, setSelectedMember] = useState<Student | null>(null);

  // ── Session state ──────────────────────────────────────────────────────────
  const sessionKey = `ccr-session-${classId}`;
  const [sessionActive, setSessionActive] = useState(false);
  const [calledTeamIds, setCalledTeamIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(sessionKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      setSessionActive(parsed.active ?? false);
      setCalledTeamIds(parsed.calledTeamIds ?? []);
    }
  }, [sessionKey]);

  const handleStartSession = () => {
    localStorage.setItem(sessionKey, JSON.stringify({ active: true, calledTeamIds: [] }));
    setSessionActive(true);
    setCalledTeamIds([]);
  };

  const handleEndSession = () => {
    localStorage.removeItem(sessionKey);
    setSessionActive(false);
    setCalledTeamIds([]);
  };

  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const router = useRouter();
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Teams that have at least one member
  const eligibleTeams = teams.filter((t) => t.students.length > 0);
  // In session mode, exclude already-called teams
  const spinEligibleTeams = useMemo(
    () => sessionActive ? eligibleTeams.filter(t => !calledTeamIds.includes(t.id)) : eligibleTeams,
    [sessionActive, calledTeamIds, eligibleTeams],
  );
  const allTeamsCalledInSession = sessionActive && spinEligibleTeams.length === 0 && eligibleTeams.length > 0;

  const showingTeams = animationPhase === 'team' || animationPhase === 'team_pause';
  const showingMembers = animationPhase === 'student' || (animationPhase === 'done' && !!selectedTeam);
  const isAnySpinning = isSpinning || animationPhase === 'team' || animationPhase === 'team_pause' || animationPhase === 'student';

  // Fire confetti
  const fireConfetti = useCallback(() => {
    if (typeof window === 'undefined') return;
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
      setTimeout(() => {
        confetti({ particleCount: 100, angle: 60, spread: 80, origin: { x: 0, y: 0.6 } });
        confetti({ particleCount: 100, angle: 120, spread: 80, origin: { x: 1, y: 0.6 } });
      }, 300);
    });
  }, []);

  // Grid columns for individual mode
  const cols = useCallback(() => {
    const n = students.length;
    if (n <= 8) return 4;
    if (n <= 16) return 5;
    if (n <= 25) return 6;
    if (n <= 36) return 7;
    if (n <= 49) return 8;
    if (n <= 64) return 9;
    return 10;
  }, [students.length])();

  // Grid columns for team cards
  const teamCols = Math.min(spinEligibleTeams.length, 5);

  // Grid columns for team members
  const memberCols = useCallback(() => {
    if (!selectedTeam) return 3;
    const n = selectedTeam.students.length;
    if (n <= 4) return 2;
    if (n <= 9) return 3;
    if (n <= 16) return 4;
    return 5;
  }, [selectedTeam])();

  useEffect(() => {
    return () => { if (animationRef.current) clearTimeout(animationRef.current); };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // ── Individual spin ──────────────────────────────────────────────────────

  const handleSpin = async () => {
    if (isAnySpinning || students.length === 0) return;
    setError('');
    setSelectedStudent(null);
    setHighlightedIndex(null);
    setIsSpinning(true);

    try {
      let hopCount = 0;
      const totalHops = 30 + Math.floor(Math.random() * 20);
      let currentDelay = 50;

      const animateHop = () => {
        setHighlightedIndex(Math.floor(Math.random() * students.length));
        hopCount++;
        if (hopCount > totalHops * 0.6) currentDelay += 20;
        if (hopCount > totalHops * 0.8) currentDelay += 40;
        if (hopCount < totalHops) animationRef.current = setTimeout(animateHop, currentDelay);
      };
      animateHop();

      const result = await spinSlotMachineAction(classId, testMode);

      if (result.error || !result.student) {
        setError(result.error || 'Failed to select a student');
        setIsSpinning(false);
        setHighlightedIndex(null);
        if (animationRef.current) clearTimeout(animationRef.current);
        return;
      }

      const selectedIndex = students.findIndex(s => s.id === result.student!.id);

      setTimeout(() => {
        if (animationRef.current) clearTimeout(animationRef.current);
        let finalHops = 0;
        let finalDelay = 200;

        const finalAnimation = () => {
          if (finalHops < 5) {
            setHighlightedIndex(Math.floor(Math.random() * students.length));
            finalHops++;
            finalDelay += 100;
            animationRef.current = setTimeout(finalAnimation, finalDelay);
          } else {
            setHighlightedIndex(selectedIndex);
            setSelectedStudent(result.student!);
            setIsSpinning(false);
            fireConfetti();
            if (!testMode) setTimeout(() => router.refresh(), 2000);
          }
        };
        finalAnimation();
      }, totalHops * 60);

    } catch {
      setError('An error occurred. Please try again.');
      setIsSpinning(false);
      setHighlightedIndex(null);
      if (animationRef.current) clearTimeout(animationRef.current);
    }
  };

  // ── Team spin ────────────────────────────────────────────────────────────

  const handleTeamSpin = async () => {
    if (isAnySpinning || spinEligibleTeams.length === 0) return;
    setError('');
    setSelectedStudent(null);
    setSelectedTeam(null);
    setSelectedMember(null);
    setHighlightedIndex(null);
    setHighlightedTeamIndex(null);
    setHighlightedMemberIndex(null);

    const resultPromise = spinTeamColdCallAction(classId, sessionActive ? calledTeamIds : []);

    setAnimationPhase('team');

    let teamHopCount = 0;
    const totalTeamHops = 12 + Math.floor(Math.random() * 6);
    let teamDelay = 60;

    const animateTeamHop = () => {
      setHighlightedTeamIndex(Math.floor(Math.random() * spinEligibleTeams.length));
      teamHopCount++;
      if (teamHopCount > totalTeamHops * 0.6) teamDelay += 25;
      if (teamHopCount > totalTeamHops * 0.8) teamDelay += 50;
      if (teamHopCount < totalTeamHops) animationRef.current = setTimeout(animateTeamHop, teamDelay);
    };
    animateTeamHop();

    try {
      const result = await resultPromise;

      if (result.error || !result.team || !result.student) {
        setError(result.error || 'Failed to select a team');
        setAnimationPhase('idle');
        setHighlightedTeamIndex(null);
        if (animationRef.current) clearTimeout(animationRef.current);
        return;
      }

      const winningTeamIndex = spinEligibleTeams.findIndex(t => t.id === result.team!.id);
      const winningTeam = spinEligibleTeams[winningTeamIndex];

      setTimeout(() => {
        if (animationRef.current) clearTimeout(animationRef.current);

        let finalTeamHops = 0;
        let finalTeamDelay = 130;

        const finalTeamAnimation = () => {
          if (finalTeamHops < 5) {
            setHighlightedTeamIndex(Math.floor(Math.random() * spinEligibleTeams.length));
            finalTeamHops++;
            finalTeamDelay += 80;
            animationRef.current = setTimeout(finalTeamAnimation, finalTeamDelay);
          } else {
            // Land on the winning team — show full-screen reveal for 1800ms
            setHighlightedTeamIndex(winningTeamIndex);
            setSelectedTeam(winningTeam);
            setAnimationPhase('team_pause');

            animationRef.current = setTimeout(() => {
              setAnimationPhase('student');
              setHighlightedTeamIndex(null);

              const members = winningTeam.students;
              let memberHopCount = 0;
              const totalMemberHops = 10 + Math.floor(Math.random() * 5);
              let memberDelay = 70;

              const animateMemberHop = () => {
                setHighlightedMemberIndex(Math.floor(Math.random() * members.length));
                memberHopCount++;
                if (memberHopCount > totalMemberHops * 0.6) memberDelay += 25;
                if (memberHopCount > totalMemberHops * 0.8) memberDelay += 55;
                if (memberHopCount < totalMemberHops)
                  animationRef.current = setTimeout(animateMemberHop, memberDelay);
              };
              animateMemberHop();

              setTimeout(() => {
                if (animationRef.current) clearTimeout(animationRef.current);

                const winningMemberIndex = members.findIndex(s => s.id === result.student!.id);
                let finalMemberHops = 0;
                let finalMemberDelay = 130;

                const finalMemberAnimation = () => {
                  if (finalMemberHops < 5) {
                    setHighlightedMemberIndex(Math.floor(Math.random() * members.length));
                    finalMemberHops++;
                    finalMemberDelay += 80;
                    animationRef.current = setTimeout(finalMemberAnimation, finalMemberDelay);
                  } else {
                    setHighlightedMemberIndex(winningMemberIndex);
                    setSelectedMember(result.student!);
                    setAnimationPhase('done');
                    fireConfetti();
                    if (sessionActive) {
                      const updated = [...calledTeamIds, result.team!.id];
                      setCalledTeamIds(updated);
                      localStorage.setItem(sessionKey, JSON.stringify({ active: true, calledTeamIds: updated }));
                    }
                    setTimeout(() => router.refresh(), 2000);
                  }
                };
                finalMemberAnimation();
              }, totalMemberHops * 45);

            }, 1800); // extended pause for full-screen reveal
          }
        };
        finalTeamAnimation();
      }, totalTeamHops * 45);

    } catch {
      setError('An error occurred. Please try again.');
      setAnimationPhase('idle');
      setHighlightedTeamIndex(null);
      if (animationRef.current) clearTimeout(animationRef.current);
    }
  };

  const handleExit = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    router.push(`/classes/${classId}`);
  };

  const rows = Math.ceil(students.length / cols);

  // ── Grids ─────────────────────────────────────────────────────────────────

  const renderGrid = () => {
    // Team mode — phase 1: show team cards (spinning)
    if (showingTeams) {
      const teamRows = Math.ceil(spinEligibleTeams.length / teamCols);
      return (
        <Box sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(${teamCols}, 1fr)`,
          gridTemplateRows: `repeat(${teamRows}, 1fr)`,
          gap: 1,
        }}>
          {spinEligibleTeams.map((team, idx) => {
            const isHighlighted = highlightedTeamIndex === idx;
            return (
              <Paper
                key={team.id}
                elevation={isHighlighted ? 8 : 2}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  overflow: 'hidden',
                  minHeight: 0,
                  p: 1,
                  pt: 1.25,
                  borderRadius: 2,
                  transition: 'all 0.09s ease-in-out',
                  transform: isHighlighted ? 'scale(1.06)' : 'scale(1)',
                  bgcolor: isHighlighted ? `${team.color}cc` : `${team.color}22`,
                  border: isHighlighted ? `2px solid ${team.color}` : `1px solid ${team.color}44`,
                  boxShadow: isHighlighted ? `0 0 16px ${team.color}66` : undefined,
                }}
              >
                <Typography
                  fontWeight="bold"
                  sx={{
                    color: isHighlighted ? '#fff' : team.color,
                    fontSize: spinEligibleTeams.length > 6 ? '0.8rem' : '0.95rem',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    mb: 0.5,
                  }}
                >
                  {team.name}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.4 }}>
                  {team.students.map((s) => (
                    <Typography
                      key={s.id}
                      sx={{
                        fontSize: spinEligibleTeams.length > 8 ? '0.6rem' : '0.68rem',
                        lineHeight: 1.3,
                        color: isHighlighted ? 'rgba(255,255,255,0.9)' : `${team.color}cc`,
                        bgcolor: isHighlighted ? 'rgba(255,255,255,0.15)' : `${team.color}18`,
                        borderRadius: '3px',
                        px: 0.5,
                        py: 0.15,
                      }}
                    >
                      {s.name.split(' ')[0]}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            );
          })}
        </Box>
      );
    }

    // Team mode — phase 2: show members of selected team (spinning or done)
    if (showingMembers && selectedTeam) {
      const members = selectedTeam.students;
      const mCols = memberCols;
      const mRows = Math.ceil(members.length / mCols);
      return (
        <Box sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(${mCols}, 1fr)`,
          gridTemplateRows: `repeat(${mRows}, 1fr)`,
          gap: 0.75,
        }}>
          {members.map((member, idx) => {
            const isHighlighted = highlightedMemberIndex === idx;
            const isWinner = animationPhase === 'done' && selectedMember?.id === member.id;
            return (
              <Paper
                key={member.id}
                elevation={isHighlighted || isWinner ? 6 : 1}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  minHeight: 0,
                  p: 0.75,
                  borderRadius: 1.5,
                  transition: 'all 0.09s ease-in-out',
                  transform: isHighlighted || isWinner ? 'scale(1.05)' : 'scale(1)',
                  bgcolor: isHighlighted || isWinner ? selectedTeam.color : `${selectedTeam.color}22`,
                  color: isHighlighted || isWinner ? '#fff' : selectedTeam.color,
                  border: isHighlighted || isWinner
                    ? `2px solid ${selectedTeam.color}`
                    : `1px solid ${selectedTeam.color}44`,
                  boxShadow: isHighlighted || isWinner ? `0 0 14px ${selectedTeam.color}66` : undefined,
                }}
              >
                <Typography
                  fontWeight={isWinner ? 'bold' : 'medium'}
                  sx={{
                    fontSize: members.length > 10 ? '0.8rem' : '0.95rem',
                    lineHeight: 1.15,
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {getDisplayName(member.name)}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      );
    }

    // Team mode — idle: show all eligible teams as a static grid
    if (displayMode === 'team') {
      if (eligibleTeams.length === 0) {
        return (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="rgba(255,255,255,0.5)">No teams with students found.</Typography>
          </Box>
        );
      }
      const idleCols = Math.min(eligibleTeams.length, 5);
      const idleRows = Math.ceil(eligibleTeams.length / idleCols);
      return (
        <Box sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(${idleCols}, 1fr)`,
          gridTemplateRows: `repeat(${idleRows}, 1fr)`,
          gap: 1,
        }}>
          {eligibleTeams.map((team) => {
            const isCalled = calledTeamIds.includes(team.id);
            return (
              <Paper
                key={team.id}
                elevation={isCalled ? 0 : 2}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  overflow: 'hidden',
                  minHeight: 0,
                  p: 1,
                  pt: 1.25,
                  borderRadius: 2,
                  bgcolor: isCalled ? 'rgba(255,255,255,0.04)' : `${team.color}22`,
                  border: isCalled ? '1px solid rgba(255,255,255,0.08)' : `1px solid ${team.color}44`,
                  opacity: isCalled ? 0.4 : 1,
                }}
              >
                <Typography
                  fontWeight="bold"
                  sx={{
                    color: isCalled ? 'rgba(255,255,255,0.4)' : team.color,
                    fontSize: eligibleTeams.length > 6 ? '0.8rem' : '0.95rem',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    mb: 0.5,
                    textDecoration: isCalled ? 'line-through' : 'none',
                  }}
                >
                  {team.name}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.4 }}>
                  {team.students.map((s) => (
                    <Typography
                      key={s.id}
                      sx={{
                        fontSize: '0.68rem',
                        lineHeight: 1.3,
                        color: isCalled ? 'rgba(255,255,255,0.3)' : `${team.color}cc`,
                        borderRadius: '3px',
                        px: 0.5,
                        py: 0.15,
                      }}
                    >
                      {s.name.split(' ')[0]}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            );
          })}
        </Box>
      );
    }

    // Individual mode: student grid
    return (
      <Box sx={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: 0.5,
      }}>
        {students.map((student, idx) => {
          const isHighlighted = highlightedIndex === idx && isSpinning;
          const isSelected = selectedStudent?.id === student.id;

          return (
            <Paper
              key={student.id}
              elevation={isHighlighted || isSelected ? 6 : 1}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                minHeight: 0,
                p: 0.5,
                borderRadius: 1,
                transition: 'all 0.08s ease-in-out',
                transform: isHighlighted || isSelected ? 'scale(1.03)' : 'scale(1)',
                bgcolor: isSelected ? '#4caf50' : isHighlighted ? '#1976d2' : 'rgba(255,255,255,0.95)',
                color: isSelected || isHighlighted ? '#fff' : '#1a1a2e',
                border: isSelected ? '2px solid #81c784' : isHighlighted ? '2px solid #64b5f6' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: isSelected ? '0 0 16px rgba(76,175,80,0.6)' : isHighlighted ? '0 0 12px rgba(25,118,210,0.5)' : undefined,
              }}
            >
              <Typography
                fontWeight={isSelected ? 'bold' : 'medium'}
                sx={{
                  fontSize: students.length > 60 ? '0.62rem' : students.length > 40 ? '0.72rem' : students.length > 25 ? '0.82rem' : '0.92rem',
                  lineHeight: 1.15,
                  textAlign: 'center',
                  wordBreak: 'break-word',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {getDisplayName(student.name)}
              </Typography>
            </Paper>
          );
        })}
      </Box>
    );
  };

  // ── Winner banner ─────────────────────────────────────────────────────────

  const renderWinnerBanner = () => {
    // Team cold call winner
    if (animationPhase === 'done' && selectedTeam && selectedMember) {
      return (
        <Box sx={{
          mx: 2, mt: 1, p: 2.5, borderRadius: 2, flexShrink: 0,
          background: `linear-gradient(135deg, ${selectedTeam.color} 0%, ${selectedTeam.color}bb 100%)`,
          textAlign: 'center',
          boxShadow: `0 0 50px ${selectedTeam.color}88`,
          animation: 'pulse 1.5s ease-in-out infinite',
          '@keyframes pulse': { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.015)' } },
        }}>
          <Typography
            sx={{
              fontSize: '1.1rem',
              fontWeight: 900,
              color: 'rgba(255,255,255,0.95)',
              letterSpacing: 4,
              textTransform: 'uppercase',
              mb: 0.5,
            }}
          >
            {selectedTeam.name}
          </Typography>
          <Typography
            sx={{
              fontSize: 'clamp(2.2rem, 5vw, 4rem)',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.1,
              textShadow: '3px 3px 8px rgba(0,0,0,0.4)',
            }}
          >
            🎉 {selectedMember.name} 🎉
          </Typography>
        </Box>
      );
    }

    // Individual winner
    if (selectedStudent && !isSpinning && displayMode === 'individual') {
      return (
        <Box sx={{
          mx: 2, mt: 1, p: 2, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
          textAlign: 'center',
          boxShadow: '0 0 40px rgba(76, 175, 80, 0.5)',
          animation: 'pulse 1.5s ease-in-out infinite',
          '@keyframes pulse': { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.015)' } },
        }}>
          {testMode && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', letterSpacing: 2, textTransform: 'uppercase', display: 'block', mb: 0.25 }}>
              Test Mode — not saved
            </Typography>
          )}
          <Typography
            sx={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.1,
              textShadow: '3px 3px 8px rgba(0,0,0,0.3)',
            }}
          >
            🎉 {selectedStudent.name} 🎉
          </Typography>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100vh',
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
      }}
    >
      {/* Top Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 0.75, borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" fontWeight="bold" color="white">{className}</Typography>
          <Typography
            variant="caption"
            sx={{
              px: 1, py: 0.25, borderRadius: 1,
              bgcolor: displayMode === 'team' ? 'rgba(124,77,255,0.3)' : 'rgba(255,107,107,0.3)',
              color: displayMode === 'team' ? '#b39dff' : '#ffb3b3',
              fontWeight: 'bold',
              letterSpacing: 1,
              textTransform: 'uppercase',
              fontSize: '0.65rem',
            }}
          >
            {displayMode === 'team' ? 'Team Spin' : 'Individual Spin'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }} size="small">
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
          <IconButton onClick={handleExit} sx={{ color: 'white' }} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mx: 2, mt: 1, flexShrink: 0 }}>{error}</Alert>}

      {/* Winner banner */}
      {renderWinnerBanner()}

      {/* Phase label when spinning members */}
      {animationPhase === 'student' && selectedTeam && (
        <Box sx={{ mx: 2, mt: 0.5, flexShrink: 0, textAlign: 'center' }}>
          <Typography variant="body1" fontWeight="bold" sx={{ color: selectedTeam.color, letterSpacing: 1 }}>
            {selectedTeam.name.toUpperCase()}
          </Typography>
        </Box>
      )}

      {/* Main content area — relative so the team_pause overlay can cover it */}
      <Box sx={{ flex: 1, overflow: 'hidden', p: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {renderGrid()}

        {/* Full-screen team reveal overlay during team_pause */}
        {animationPhase === 'team_pause' && selectedTeam && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${selectedTeam.color}ee 0%, ${selectedTeam.color}bb 100%)`,
            animation: 'teamReveal 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            '@keyframes teamReveal': {
              '0%': { opacity: 0, transform: 'scale(0.82)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
          }}>
            <Typography sx={{
              fontSize: 'clamp(1rem, 2.5vw, 1.6rem)',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.8)',
              letterSpacing: 6,
              textTransform: 'uppercase',
              mb: 2,
            }}>
              Selected Team
            </Typography>
            <Typography sx={{
              fontSize: 'clamp(3.5rem, 10vw, 8rem)',
              fontWeight: 900,
              color: 'white',
              textAlign: 'center',
              textShadow: '4px 4px 16px rgba(0,0,0,0.35)',
              lineHeight: 1,
              px: 2,
            }}>
              {selectedTeam.name}
            </Typography>
            <Typography sx={{
              fontSize: 'clamp(0.9rem, 2vw, 1.3rem)',
              color: 'rgba(255,255,255,0.75)',
              mt: 3,
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}>
              Picking a student…
            </Typography>
          </Box>
        )}
      </Box>

      {/* Bottom Bar */}
      <Box sx={{
        px: 2, py: 1,
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2,
        borderTop: '1px solid rgba(255,255,255,0.1)',
        bgcolor: 'rgba(0,0,0,0.2)',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        {displayMode === 'individual' ? (
          <>
            <Button
              variant="contained"
              size="large"
              onClick={handleSpin}
              disabled={isAnySpinning || students.length === 0}
              sx={{
                px: 4, py: 1, fontSize: '1rem', fontWeight: 'bold', borderRadius: 2,
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
                boxShadow: '0 4px 20px rgba(255,107,107,0.4)',
                '&:hover': { background: 'linear-gradient(135deg, #ff8e53 0%, #ff6b6b 100%)' },
                '&:disabled': { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' },
              }}
              startIcon={isSpinning ? <CircularProgress size={20} color="inherit" /> : <CasinoIcon />}
            >
              {isSpinning ? 'Spinning…' : 'SPIN'}
            </Button>

            <FormControlLabel
              control={
                <Switch
                  checked={testMode}
                  onChange={(e) => setTestMode(e.target.checked)}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#ffb300' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#ffb300' },
                  }}
                />
              }
              label={
                <Typography variant="caption" sx={{ color: testMode ? '#ffb300' : 'rgba(255,255,255,0.6)', fontWeight: testMode ? 'bold' : 'normal' }}>
                  Test mode (no save)
                </Typography>
              }
            />
          </>
        ) : (
          <>
            <Button
              variant="contained"
              size="large"
              onClick={handleTeamSpin}
              disabled={isAnySpinning || allTeamsCalledInSession}
              sx={{
                px: 4, py: 1, fontSize: '1rem', fontWeight: 'bold', borderRadius: 2,
                background: 'linear-gradient(135deg, #7c4dff 0%, #448aff 100%)',
                boxShadow: '0 4px 20px rgba(124,77,255,0.4)',
                '&:hover': { background: 'linear-gradient(135deg, #448aff 0%, #7c4dff 100%)' },
                '&:disabled': { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' },
              }}
              startIcon={
                (animationPhase === 'team' || animationPhase === 'team_pause' || animationPhase === 'student')
                  ? <CircularProgress size={20} color="inherit" />
                  : <GroupIcon />
              }
            >
              {(animationPhase === 'team' || animationPhase === 'team_pause' || animationPhase === 'student')
                ? 'Spinning…'
                : allTeamsCalledInSession
                  ? 'All Teams Called'
                  : 'TEAM SPIN'}
            </Button>

            {sessionActive ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<StopCircleIcon />}
                onClick={handleEndSession}
                disabled={isAnySpinning}
                sx={{
                  color: '#ff8a65', borderColor: '#ff8a65',
                  '&:hover': { borderColor: '#ff5722', color: '#ff5722', bgcolor: 'rgba(255,87,34,0.08)' },
                  '&:disabled': { color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.1)' },
                }}
              >
                End Session ({calledTeamIds.length}/{eligibleTeams.length})
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="small"
                startIcon={<PlayCircleIcon />}
                onClick={handleStartSession}
                disabled={isAnySpinning}
                sx={{
                  color: '#81c784', borderColor: '#81c784',
                  '&:hover': { borderColor: '#4caf50', color: '#4caf50', bgcolor: 'rgba(76,175,80,0.08)' },
                  '&:disabled': { color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Start Session
              </Button>
            )}

            {sessionActive && (
              <Typography variant="body2" sx={{ color: allTeamsCalledInSession ? '#ff8a65' : '#81c784', fontWeight: 'bold' }}>
                Session: {calledTeamIds.length}/{eligibleTeams.length} teams
              </Typography>
            )}
          </>
        )}

        <Typography variant="body2" color="rgba(255,255,255,0.5)" sx={{ ml: 1 }}>F11 fullscreen</Typography>
      </Box>
    </Box>
  );
}
