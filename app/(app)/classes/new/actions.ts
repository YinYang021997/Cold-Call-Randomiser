'use server';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createClassSchema, studentsArraySchema } from '@/lib/validators';

interface CreateClassData {
  name: string;
  classroom: string;
  code: string;
  timing: string;
  dates: string;
  status: 'ACTIVE' | 'ARCHIVED';
  students: { name: string; uni: string }[];
}

export async function createClassAction(data: CreateClassData) {
  await requireAuth();

  // Validate class data
  const classValidation = createClassSchema.safeParse({
    name: data.name,
    classroom: data.classroom,
    code: data.code,
    timing: data.timing,
    dates: data.dates,
    status: data.status,
  });

  if (!classValidation.success) {
    return { error: classValidation.error.errors[0].message };
  }

  // Validate students
  const studentsValidation = studentsArraySchema.safeParse(data.students);

  if (!studentsValidation.success) {
    return { error: studentsValidation.error.errors[0].message };
  }

  if (data.students.length === 0) {
    return { error: 'At least one student is required' };
  }

  try {
    // Create class with students in a transaction
    const newClass = await prisma.class.create({
      data: {
        name: data.name,
        classroom: data.classroom,
        code: data.code,
        timing: data.timing,
        dates: data.dates,
        status: data.status,
        students: {
          create: data.students.map(s => ({
            name: s.name,
            uni: s.uni,
          })),
        },
      },
    });

    return { success: true, classId: newClass.id };
  } catch (error) {
    console.error('Error creating class:', error);
    return { error: 'Failed to create class. Please try again.' };
  }
}
