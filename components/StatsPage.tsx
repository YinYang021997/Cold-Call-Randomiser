'use client';

import Link from 'next/link';
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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Analytics as AnalyticsIcon,
  Person as PersonIcon,
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
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="xl">
        <Link href={`/classes/${classId}`} style={{ textDecoration: 'none' }}>
          <Button startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
            Back to Class
          </Button>
        </Link>

        <Card elevation={3}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
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
