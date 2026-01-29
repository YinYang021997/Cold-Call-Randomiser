'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Upload as UploadIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { addStudentsAction, getClassNameAction } from './actions';

interface Student {
  name: string;
  uni: string;
}

export default function AddStudentsPage({ params }: { params: { classId: string } }) {
  const [className, setClassName] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [csvError, setCsvError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();

  const handleNavigation = (path: string) => {
    setNavigating(true);
    router.push(path);
  };

  useEffect(() => {
    const loadClass = async () => {
      const result = await getClassNameAction(params.classId);
      if (result.error) {
        setError(result.error);
      } else if (result.name) {
        setClassName(result.name);
      }
      setLoading(false);
    };
    loadClass();
  }, [params.classId]);

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

    setSaving(true);

    try {
      const result = await addStudentsAction(
        params.classId,
        students.map(s => ({ name: s.name.trim(), uni: s.uni.trim() }))
      );

      if (result.error) {
        setError(result.error);
        setSaving(false);
      } else {
        router.push(`/classes/${params.classId}`);
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
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
          onClick={() => handleNavigation(`/classes/${params.classId}`)}
          disabled={navigating || saving}
        >
          Back to Class
        </Button>

        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PersonAddIcon sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
              <Typography variant="h4" component="h1">
                Add Students
              </Typography>
            </Box>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
              {className}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
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
                    label={`${students.length} student${students.length !== 1 ? 's' : ''} to be added`}
                    color="success"
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
                  onClick={() => handleNavigation(`/classes/${params.classId}`)}
                  disabled={navigating || saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  disabled={saving || navigating || students.length === 0}
                >
                  {saving ? <CircularProgress size={24} /> : `Add ${students.length} Student${students.length !== 1 ? 's' : ''}`}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
