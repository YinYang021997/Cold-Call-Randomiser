import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  role: z.enum(['TEACHER', 'TA']),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(4, 'Password must be at least 4 characters'),
});

export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  classroom: z.string().min(1, 'Classroom is required'),
  code: z.string().min(1, 'Class code is required'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid start time format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid end time format'),
  startDate: z.coerce.date({ required_error: 'Start date is required' }),
  endDate: z.coerce.date({ required_error: 'End date is required' }),
});

export const studentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  uni: z.string().min(1, 'UNI is required'),
});

export const studentsArraySchema = z.array(studentSchema);

export const updateScoreSchema = z.object({
  coldCallId: z.string(),
  score: z.number().int().min(-2).max(2).nullable(),
});
