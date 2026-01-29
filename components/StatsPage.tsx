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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Analytics as AnalyticsIcon,
  Person as PersonIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

interface StudentStats {
  id: string;
  name: string;
  uni: string;
  timesCalled: number;
  averageScore: number | null;
  cumulativeScore: number;
  lastCalled: Date | null;
}

interface StatsPageProps {
  classId: string;
  className: string;
  studentStats: StudentStats[];
}

export function StatsPage({ classId, className, studentStats }: StatsPageProps) {
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();

  const handleBack = () => {
    setNavigating(true);
    router.push(`/classes/${classId}`);
  };

  const exportToCSV = () => {
    // Create CSV header
    const headers = ['Name', 'UNI', 'Times Called', 'Cumulative Score', 'Average Score', 'Last Called'];

    // Create CSV rows
    const rows = studentStats.map(student => [
      student.name,
      student.uni,
      student.timesCalled.toString(),
      student.cumulativeScore.toString(),
      student.averageScore !== null ? student.averageScore.toFixed(2) : '',
      student.lastCalled
        ? new Date(student.lastCalled).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '',
    ]);

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${className.replace(/[^a-z0-9]/gi, '_')}_stats.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          startIcon={navigating ? <CircularProgress size={20} color="inherit" /> : <ArrowBackIcon />}
          sx={{ mb: 3 }}
          onClick={handleBack}
          disabled={navigating}
        >
          Back to Class
        </Button>

        <Card elevation={3}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AnalyticsIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="h1">
                    {className}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Student Statistics
                  </Typography>
                </Box>
              </Box>
              {studentStats.length > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={exportToCSV}
                >
                  Export CSV
                </Button>
              )}
            </Box>

            {studentStats.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No students in this class yet
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell><Typography fontWeight="bold">Name</Typography></TableCell>
                      <TableCell><Typography fontWeight="bold">UNI</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight="bold">Times Called</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight="bold">Cumulative Score</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight="bold">Average Score</Typography></TableCell>
                      <TableCell><Typography fontWeight="bold">Last Called</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentStats.map((student) => (
                      <TableRow key={student.id} hover>
                        <TableCell>
                          <Typography fontWeight="medium">{student.name}</Typography>
                        </TableCell>
                        <TableCell>{student.uni}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={student.timesCalled}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${student.cumulativeScore >= 0 ? '+' : ''}${student.cumulativeScore}`}
                            size="small"
                            color={
                              student.cumulativeScore > 0
                                ? 'success'
                                : student.cumulativeScore < 0
                                ? 'error'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {student.averageScore !== null
                              ? `${student.averageScore >= 0 ? '+' : ''}${student.averageScore.toFixed(2)}`
                              : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {student.lastCalled
                              ? new Date(student.lastCalled).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
