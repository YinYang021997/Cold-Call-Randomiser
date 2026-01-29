'use server';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { studentsArraySchema } from '@/lib/validators';

export async function getClassNameAction(classId: string) {
  await requireAuth();

  try {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: { name: true },
    });

    if (!classData) {
      return { error: 'Class not found' };
    }

    return { name: classData.name };
  } catch (error) {
    console.error('Error fetching class:', error);
    return { error: 'Failed to fetch class details.' };
  }
}

export async function addStudentsAction(
  classId: string,
  students: { name: string; uni: string }[]
) {
  await requireAuth();

  // Validate students
  const validation = studentsArraySchema.safeParse(students);

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  if (students.length === 0) {
    return { error: 'At least one student is required' };
  }

  try {
    // Verify class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      return { error: 'Class not found' };
    }

    // Add students to the class
    await prisma.student.createMany({
      data: students.map(s => ({
        classId,
        name: s.name,
        uni: s.uni,
      })),
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding students:', error);
    return { error: 'Failed to add students. Please try again.' };
  }
}
