'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import dayjs, { Dayjs } from 'dayjs';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
  IconButton,
  Paper,
  Chip,
  CircularProgress,
  Backdrop,
  Grid,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import {
  ArrowBack as ArrowBackIcon,
  Upload as UploadIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { createClassAction } from './actions';

interface Student {
  name: string;
  uni: string;
}

export default function NewClassPage() {
  const [name, setName] = useState('');
  const [classroom, setClassroom] = useState('');
  const [code, setCode] = useState('');
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [csvError, setCsvError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();

  const handleNavigation = (path: string) => {
    setNavigating(true);
    router.push(path);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setCsvError('File size must be less than 5MB');
      return;
    }

    setCsvError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];

        const headers = Object.keys(data[0] || {}).map(h => h.toLowerCase().trim());
        if (!headers.includes('name') || !headers.includes('uni')) {
          setCsvError('CSV must have "name" and "uni" columns');
          return;
        }

        const parsedStudents: Student[] = [];
        const errors: string[] = [];

        data.forEach((row, idx) => {
          const name = (row.name || row.Name || row.NAME || '').trim();
          const uni = (row.uni || row.UNI || row.Uni || '').trim();

          if (!name || !uni) {
            errors.push(`Row ${idx + 2}: Missing name or UNI`);
          } else {
            parsedStudents.push({ name, uni });
          }
        });

        if (errors.length > 0) {
          setCsvError(errors.join(', '));
        } else {
          setStudents(prev => [...prev, ...parsedStudents]);
          setCsvError('');
        }
      },
      error: (error) => {
        setCsvError(`Failed to parse CSV: ${error.message}`);
      },
    });

    e.target.value = '';
  };

  const addManualStudent = () => {
    setStudents(prev => [...prev, { name: '', uni: '' }]);
  };

  const updateStudent = (index: number, field: 'name' | 'uni', value: string) => {
    setStudents(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeStudent = (index: number) => {
    setStudents(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!startTime || !endTime) {
      setError('Please select start and end times');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    if (endDate.isBefore(startDate)) {
      setError('End date must be after start date');
      return;
    }

    if (students.length === 0) {
      setError('Please add at least one student');
      return;
    }

    const invalidStudents = students.filter(s => !s.name.trim() || !s.uni.trim());
    if (invalidStudents.length > 0) {
      setError('All students must have a name and UNI');
      return;
    }

    setLoading(true);

    try {
      const result = await createClassAction({
        name,
        classroom,
        code,
        startTime: startTime.format('HH:mm'),
        endTime: endTime.format('HH:mm'),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        students: students.map(s => ({ name: s.name.trim(), uni: s.uni.trim() })),
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else if (result.classId) {
        router.push(`/classes/${result.classId}`);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={navigating}
        >
          <CircularProgress color="inherit" />
        </Backdrop>

        <Container maxWidth="md">
          <Button
            startIcon={navigating ? <CircularProgress size={20} color="inherit" /> : <ArrowBackIcon />}
            sx={{ mb: 3 }}
            onClick={() => handleNavigation('/')}
            disabled={navigating || loading}
          >
            Back to Classes
          </Button>

          <Card elevation={3}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                Create New Class
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Class Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Classroom"
                      value={classroom}
                      onChange={(e) => setClassroom(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Class Code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    {/* Empty grid item for layout */}
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TimePicker
                      label="Start Time"
                      value={startTime}
                      onChange={(newValue) => setStartTime(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TimePicker
                      label="End Time"
                      value={endTime}
                      onChange={(newValue) => setEndTime(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DatePicker
                      label="Start Date"
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DatePicker
                      label="End Date"
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                      minDate={startDate || undefined}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                        },
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" gutterBottom>
                  Students
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Button
                    component="label"
                    variant="contained"
                    startIcon={<UploadIcon />}
                  >
                    Upload CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      hidden
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    onClick={addManualStudent}
                  >
                    Add Student Manually
                  </Button>
                </Box>

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  CSV must have columns: name, uni
                </Typography>

                {csvError && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    {csvError}
                  </Alert>
                )}

                {students.length > 0 && (
                  <Box>
                    <Chip
                      label={`${students.length} student${students.length !== 1 ? 's' : ''} added`}
                      color="primary"
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />

                    <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                      {students.map((student, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                          <TextField
                            size="small"
                            label="Name"
                            value={student.name}
                            onChange={(e) => updateStudent(idx, 'name', e.target.value)}
                            sx={{ flex: 1 }}
                          />
                          <TextField
                            size="small"
                            label="UNI"
                            value={student.uni}
                            onChange={(e) => updateStudent(idx, 'uni', e.target.value)}
                            sx={{ width: 150 }}
                          />
                          <IconButton
                            color="error"
                            onClick={() => removeStudent(idx)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </Paper>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleNavigation('/')}
                    disabled={navigating || loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || navigating}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Create Class'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </LocalizationProvider>
  );
}
