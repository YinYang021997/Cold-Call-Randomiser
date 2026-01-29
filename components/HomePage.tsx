'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  AppBar,
  Toolbar,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import { Add as AddIcon, School as SchoolIcon } from '@mui/icons-material';
import { LogoutButton } from './LogoutButton';

interface ClassData {
  id: string;
  name: string;
  classroom: string;
  code: string;
  timing: string;
  dates: string;
  status: string;
  _count: {
    students: number;
  };
}

interface HomePageProps {
  classes: ClassData[];
  firstName: string;
}

export function HomePage({ classes, firstName }: HomePageProps) {
  const [navigating, setNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const router = useRouter();

  const handleClassClick = (classId: string) => {
    setNavigating(true);
    setNavigatingTo(classId);
    router.push(`/classes/${classId}`);
  };

  const handleCreateClick = () => {
    setNavigating(true);
    setNavigatingTo('new');
    router.push('/classes/new');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={navigating}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <AppBar position="static" elevation={1}>
        <Toolbar>
          <SchoolIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cold Call Randomizer
          </Typography>
          <LogoutButton />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Greeting */}
        <Typography
          variant="h3"
          component="h1"
          sx={{ mb: 4, fontWeight: 400 }}
        >
          Hi, {firstName}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" component="h2" color="text.secondary">
            My Classes
          </Typography>
          <Button
            variant="contained"
            startIcon={navigatingTo === 'new' ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            onClick={handleCreateClick}
            disabled={navigating}
          >
            Create Class
          </Button>
        </Box>

        {classes.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                You haven't created any classes yet
              </Typography>
              <Button
                variant="contained"
                startIcon={navigatingTo === 'new' ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                sx={{ mt: 2 }}
                onClick={handleCreateClick}
                disabled={navigating}
              >
                Create Your First Class
              </Button>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><Typography fontWeight="bold">Name</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Classroom</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Code</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Timing</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Dates</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Status</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Students</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow
                    key={cls.id}
                    hover
                    onClick={() => !navigating && handleClassClick(cls.id)}
                    sx={{
                      cursor: navigating ? 'wait' : 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      opacity: navigating && navigatingTo !== cls.id ? 0.5 : 1,
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {navigatingTo === cls.id && <CircularProgress size={16} />}
                        <Typography
                          color="primary"
                          fontWeight="medium"
                          sx={{ '&:hover': { textDecoration: 'underline' } }}
                        >
                          {cls.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{cls.classroom}</TableCell>
                    <TableCell>{cls.code}</TableCell>
                    <TableCell>{cls.timing}</TableCell>
                    <TableCell>{cls.dates}</TableCell>
                    <TableCell>
                      <Chip
                        label={cls.status}
                        color={cls.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={cls._count.students} size="small" variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Box>
  );
}
