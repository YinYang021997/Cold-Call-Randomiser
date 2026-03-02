'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Backdrop,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  History as HistoryIcon,
  Analytics as AnalyticsIcon,
  Slideshow as SlideshowIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  PlayCircle as PlayCircleIcon,
  StopCircle as StopCircleIcon,
} from '@mui/icons-material';
import { HistoryTab } from './HistoryTab';
import { TeamsTab } from './TeamsTab';

interface Student {
  id: string;
  name: string;
  uni: string;
  teamId: string | null;
}

interface ColdCall {
  id: string;
  calledAt: Date;
  score: number | null;
  notes: string | null;
  student: Student;
}

interface Team {
  id: string;
  name: string;
  color: string;
  students: Student[];
}

interface ClassData {
  id: string;
  name: string;
  classroom: string;
  code: string;
  timing: string;
  dates: string;
  status: string;
  students: Student[];
  coldCalls: ColdCall[];
  teams: Team[];
}

interface ClassDetailProps {
  classData: ClassData;
}

export function ClassDetail({ classData }: ClassDetailProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [presentDialogOpen, setPresentDialogOpen] = useState(false);
  const router = useRouter();

  const sessionKey = `ccr-session-${classData.id}`;
  const [sessionActive, setSessionActive] = useState(false);
  const [calledTeamCount, setCalledTeamCount] = useState(0);
  const eligibleTeamCount = classData.teams.filter(t => t.students.length > 0).length;

  useEffect(() => {
    const stored = localStorage.getItem(sessionKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      setSessionActive(parsed.active ?? false);
      setCalledTeamCount((parsed.calledTeamIds ?? []).length);
    }
  }, [sessionKey]);

  const handleStartSession = () => {
    localStorage.setItem(sessionKey, JSON.stringify({ active: true, calledTeamIds: [] }));
    setSessionActive(true);
    setCalledTeamCount(0);
  };

  const handleEndSession = () => {
    localStorage.removeItem(sessionKey);
    setSessionActive(false);
    setCalledTeamCount(0);
  };

  // Tabs: History=0, Teams=1, Stats=2
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 2) {
      setNavigating(true);
      setNavigatingTo('stats');
      router.push(`/classes/${classData.id}/stats`);
    } else {
      setActiveTab(newValue);
    }
  };

  const handleNavigation = (destination: string, path: string) => {
    setNavigating(true);
    setNavigatingTo(destination);
    router.push(path);
  };

  const handlePresentMode = (mode: 'individual' | 'team') => {
    setPresentDialogOpen(false);
    handleNavigation('present', `/classes/${classData.id}/present?mode=${mode}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={navigating}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Mode selection dialog */}
      <Dialog open={presentDialogOpen} onClose={() => setPresentDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Choose Presentation Mode
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PersonIcon />}
              onClick={() => handlePresentMode('individual')}
              sx={{
                py: 2,
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #ff8e53 0%, #ff6b6b 100%)' },
              }}
            >
              Individual Spin
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<GroupIcon />}
              onClick={() => handlePresentMode('team')}
              disabled={eligibleTeamCount === 0}
              sx={{
                py: 2,
                background: 'linear-gradient(135deg, #7c4dff 0%, #448aff 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #448aff 0%, #7c4dff 100%)' },
                '&:disabled': { background: 'rgba(0,0,0,0.12)' },
              }}
            >
              Team Spin
              {eligibleTeamCount === 0 && (
                <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                  (no teams set up)
                </Typography>
              )}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPresentDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="xl">
        <Button
          startIcon={navigatingTo === 'home' ? <CircularProgress size={20} color="inherit" /> : <ArrowBackIcon />}
          sx={{ mb: 3 }}
          onClick={() => handleNavigation('home', '/')}
          disabled={navigating}
        >
          Back to Classes
        </Button>

        <Card elevation={3} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {classData.name}
                </Typography>
                <Chip
                  label={classData.status}
                  color={classData.status === 'ACTIVE' ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={navigatingTo === 'edit' ? <CircularProgress size={20} /> : <EditIcon />}
                  onClick={() => handleNavigation('edit', `/classes/${classData.id}/edit`)}
                  disabled={navigating}
                >
                  Edit Class
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={navigatingTo === 'add-students' ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
                  onClick={() => handleNavigation('add-students', `/classes/${classData.id}/add-students`)}
                  disabled={navigating}
                >
                  Add Students
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={navigatingTo === 'present' ? <CircularProgress size={20} color="inherit" /> : <SlideshowIcon />}
                  onClick={() => setPresentDialogOpen(true)}
                  disabled={navigating}
                >
                  Present
                </Button>
                {eligibleTeamCount > 0 && (
                  sessionActive ? (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<StopCircleIcon />}
                      onClick={handleEndSession}
                      disabled={navigating}
                    >
                      End Session ({calledTeamCount}/{eligibleTeamCount})
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<PlayCircleIcon />}
                      onClick={handleStartSession}
                      disabled={navigating}
                    >
                      Start Session
                    </Button>
                  )
                )}
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Classroom</Typography>
                <Typography variant="body1" fontWeight="medium">{classData.classroom}</Typography>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Code</Typography>
                <Typography variant="body1" fontWeight="medium">{classData.code}</Typography>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Timing</Typography>
                <Typography variant="body1" fontWeight="medium">{classData.timing}</Typography>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Dates</Typography>
                <Typography variant="body1" fontWeight="medium">{classData.dates}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card elevation={3}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab icon={<HistoryIcon />} iconPosition="start" label="History" disabled={navigating} />
              <Tab icon={<GroupIcon />} iconPosition="start" label="Teams" disabled={navigating} />
              <Tab
                icon={navigatingTo === 'stats' ? <CircularProgress size={20} /> : <AnalyticsIcon />}
                iconPosition="start"
                label="Stats"
                disabled={navigating}
              />
            </Tabs>
          </Box>

          <CardContent>
            {activeTab === 0 && (
              <HistoryTab coldCalls={classData.coldCalls} />
            )}

            {activeTab === 1 && (
              <TeamsTab
                classId={classData.id}
                students={classData.students}
                teams={classData.teams}
              />
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
