'use client';

import { useState } from 'react';
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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  Casino as CasinoIcon,
  History as HistoryIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { SlotMachine } from './SlotMachine';
import { HistoryTab } from './HistoryTab';

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
}

interface ClassDetailProps {
  classData: ClassData;
}

export function ClassDetail({ classData }: ClassDetailProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const router = useRouter();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 2) {
      // Stats tab - navigate to stats page
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={navigating}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

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
              <Box sx={{ display: 'flex', gap: 2 }}>
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
              <Tab icon={<CasinoIcon />} iconPosition="start" label="Cold Call" disabled={navigating} />
              <Tab icon={<HistoryIcon />} iconPosition="start" label="History" disabled={navigating} />
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
              <SlotMachine classId={classData.id} students={classData.students} />
            )}

            {activeTab === 1 && (
              <HistoryTab coldCalls={classData.coldCalls} />
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
