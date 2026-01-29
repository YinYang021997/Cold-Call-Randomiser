'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';
import { updateClassAction, getClassAction } from './actions';

export default function EditClassPage({ params }: { params: { classId: string } }) {
  const [name, setName] = useState('');
  const [classroom, setClassroom] = useState('');
  const [code, setCode] = useState('');
  const [timing, setTiming] = useState('');
  const [dates, setDates] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadClass = async () => {
      const result = await getClassAction(params.classId);
      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else if (result.class) {
        setName(result.class.name);
        setClassroom(result.class.classroom);
        setCode(result.class.code);
        setTiming(result.class.timing);
        setDates(result.class.dates);
        setStatus(result.class.status as 'ACTIVE' | 'ARCHIVED');
        setLoading(false);
      }
    };
    loadClass();
  }, [params.classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const result = await updateClassAction(params.classId, {
        name,
        classroom,
        code,
        timing,
        dates,
        status,
      });

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
      <Container maxWidth="md">
        <Link href={`/classes/${params.classId}`} style={{ textDecoration: 'none' }}>
          <Button startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
            Back to Class
          </Button>
        </Link>

        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <EditIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
              <Typography variant="h4" component="h1">
                Edit Class
              </Typography>
            </Box>

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

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                <Link href={`/classes/${params.classId}`} style={{ textDecoration: 'none' }}>
                  <Button variant="outlined">Cancel</Button>
                </Link>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
