'use client';

import Link from 'next/link';
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
}

export function HomePage({ classes }: HomePageProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            My Classes
          </Typography>
          <Link href="/classes/new" style={{ textDecoration: 'none' }}>
            <Button variant="contained" startIcon={<AddIcon />}>
              Create Class
            </Button>
          </Link>
        </Box>

        {classes.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                You haven't created any classes yet
              </Typography>
              <Link href="/classes/new" style={{ textDecoration: 'none' }}>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }}>
                  Create Your First Class
                </Button>
              </Link>
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
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <TableCell>
                      <Link href={`/classes/${cls.id}`} style={{ textDecoration: 'none' }}>
                        <Typography color="primary" fontWeight="medium" sx={{ '&:hover': { textDecoration: 'underline' } }}>
                          {cls.name}
                        </Typography>
                      </Link>
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
