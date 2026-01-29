'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Papa from 'papaparse';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
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
  const [timing, setTiming] = useState('');
  const [dates, setDates] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [students, setStudents] = useState<Student[]>([]);
  const [csvError, setCsvError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        timing,
        dates,
        status,
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="md">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Button startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
            Back to Classes
          </Button>
        </Link>

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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Class Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Classroom"
                    value={classroom}
                    onChange={(e) => setClassroom(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Class Code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Timing"
                    value={timing}
                    onChange={(e) => setTiming(e.target.value)}
                    placeholder="e.g., Weds 10:10–11:30"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Dates"
                    value={dates}
                    onChange={(e) => setDates(e.target.value)}
                    placeholder="e.g., Jan 22 – May 2, 2026"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={status}
                      label="Status"
                      onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'ARCHIVED')}
                    >
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="ARCHIVED">Archived</MenuItem>
                    </Select>
                  </FormControl>
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
                <Link href="/" style={{ textDecoration: 'none' }}>
                  <Button variant="outlined">Cancel</Button>
                </Link>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Class'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
