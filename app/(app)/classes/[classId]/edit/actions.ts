'use server';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createClassSchema } from '@/lib/validators';

interface UpdateClassData {
  name: string;
  classroom: string;
  code: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
}

export async function getClassAction(classId: string) {
  const session = await requireAuth();

  try {
    const classData = await prisma.class.findUnique({
      where: {
        id: classId,
        userId: session.userId,
      },
      select: {
        id: true,
        name: true,
        classroom: true,
        code: true,
        startTime: true,
        endTime: true,
        startDate: true,
        endDate: true,
        students: {
          select: {
            id: true,
            name: true,
            uni: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!classData) {
      return { error: 'Class not found' };
    }

    return { class: classData };
  } catch (error) {
    console.error('Error fetching class:', error);
    return { error: 'Failed to fetch class details.' };
  }
}

export async function updateClassAction(classId: string, data: UpdateClassData) {
  const session = await requireAuth();

  // Validate class data
  const validation = createClassSchema.safeParse({
    name: data.name,
    classroom: data.classroom,
    code: data.code,
    startTime: data.startTime,
    endTime: data.endTime,
    startDate: data.startDate,
    endDate: data.endDate,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    await prisma.class.update({
      where: {
        id: classId,
        userId: session.userId,
      },
      data: {
        name: data.name,
        classroom: data.classroom,
        code: data.code,
        startTime: data.startTime,
        endTime: data.endTime,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating class:', error);
    return { error: 'Failed to update class. Please try again.' };
  }
}

export async function removeStudentAction(classId: string, studentId: string) {
  const session = await requireAuth();

  try {
    // Verify class belongs to user
    const classData = await prisma.class.findUnique({
      where: {
        id: classId,
        userId: session.userId,
      },
    });

    if (!classData) {
      return { error: 'Class not found' };
    }

    // Verify student belongs to this class
    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
        classId: classId,
      },
    });

    if (!student) {
      return { error: 'Student not found' };
    }

    // Delete the student (this will cascade delete their cold calls)
    await prisma.student.delete({
      where: { id: studentId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing student:', error);
    return { error: 'Failed to remove student. Please try again.' };
  }
}
