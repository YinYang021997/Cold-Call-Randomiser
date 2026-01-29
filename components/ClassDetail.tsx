'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  Chip,
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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="xl">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Button startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
            Back to Classes
          </Button>
        </Link>

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
                <Link href={`/classes/${classData.id}/edit`} style={{ textDecoration: 'none' }}>
                  <Button variant="outlined" startIcon={<EditIcon />}>
                    Edit Class
                  </Button>
                </Link>
                <Link href={`/classes/${classData.id}/add-students`} style={{ textDecoration: 'none' }}>
                  <Button variant="contained" color="success" startIcon={<PersonAddIcon />}>
                    Add Students
                  </Button>
                </Link>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Classroom</Typography>
                <Typography variant="body1" fontWeight="medium">{classData.classroom}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Code</Typography>
                <Typography variant="body1" fontWeight="medium">{classData.code}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Timing</Typography>
                <Typography variant="body1" fontWeight="medium">{classData.timing}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Dates</Typography>
                <Typography variant="body1" fontWeight="medium">{classData.dates}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card elevation={3}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab icon={<CasinoIcon />} iconPosition="start" label="Cold Call" />
              <Tab icon={<HistoryIcon />} iconPosition="start" label="History" />
              <Tab
                icon={<AnalyticsIcon />}
                iconPosition="start"
                label="Stats"
                component={Link}
                href={`/classes/${classData.id}/stats`}
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
