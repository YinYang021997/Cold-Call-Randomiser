'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Backdrop,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { updateClassAction, getClassAction, removeStudentAction } from './actions';

interface Student {
  id: string;
  name: string;
  uni: string;
}

export default function EditClassPage({ params }: { params: { classId: string } }) {
  const [name, setName] = useState('');
  const [classroom, setClassroom] = useState('');
  const [code, setCode] = useState('');
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const router = useRouter();

  const handleNavigation = (destination: string, path: string) => {
    setNavigating(true);
    setNavigatingTo(destination);
    router.push(path);
  };

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
        // Parse time strings (HH:mm format)
        setStartTime(dayjs(result.class.startTime, 'HH:mm'));
        setEndTime(dayjs(result.class.endTime, 'HH:mm'));
        // Parse date strings
        setStartDate(dayjs(result.class.startDate));
        setEndDate(dayjs(result.class.endDate));
        setStudents(result.class.students || []);
        setLoading(false);
      }
    };
    loadClass();
  }, [params.classId]);

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

    setSaving(true);

    try {
      const result = await updateClassAction(params.classId, {
        name,
        classroom,
        code,
        startTime: startTime.format('HH:mm'),
        endTime: endTime.format('HH:mm'),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
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

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;

    setDeleting(true);
    try {
      const result = await removeStudentAction(params.classId, studentToDelete.id);

      if (result.error) {
        setError(result.error);
      } else {
        setStudents(students.filter(s => s.id !== studentToDelete.id));
      }
    } catch (err) {
      setError('Failed to remove student. Please try again.');
    }

    setDeleting(false);
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

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
            startIcon={navigatingTo === 'back' ? <CircularProgress size={20} color="inherit" /> : <ArrowBackIcon />}
            sx={{ mb: 3 }}
            onClick={() => handleNavigation('back', `/classes/${params.classId}`)}
            disabled={navigating || saving}
          >
            Back to Class
          </Button>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <EditIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                <Typography variant="h4" component="h1">
                  Edit Class
                </Typography>
              </Box>

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
                    {/* Empty grid item for layout */}
                  </Grid>
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
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

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleNavigation('cancel', `/classes/${params.classId}`)}
                    disabled={navigating || saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving || navigating}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Students Section */}
          <Card elevation={3}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ fontSize: 28, color: 'primary.main', mr: 2 }} />
                  <Typography variant="h5" component="h2">
                    Students ({students.length})
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleNavigation('add', `/classes/${params.classId}/add-students`)}
                  disabled={navigating || saving}
                  startIcon={navigatingTo === 'add' ? <CircularProgress size={16} /> : undefined}
                >
                  Add Students
                </Button>
              </Box>

              {students.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No students in this class yet.
                </Typography>
              ) : (
                <List>
                  {students.map((student, index) => (
                    <Box key={student.id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemText
                          primary={student.name}
                          secondary={student.uni}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() => handleDeleteClick(student)}
                            title="Remove student"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Container>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
          <DialogTitle>Remove Student</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to remove <strong>{studentToDelete?.name}</strong> from this class?
              This will also delete all their cold call history for this class.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} disabled={deleting}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={deleting}
            >
              {deleting ? <CircularProgress size={20} /> : 'Remove'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
