'use server';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createClassSchema } from '@/lib/validators';

interface UpdateClassData {
  name: string;
  classroom: string;
  code: string;
  timing: string;
  dates: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

export async function getClassAction(classId: string) {
  await requireAuth();

  try {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        classroom: true,
        code: true,
        timing: true,
        dates: true,
        status: true,
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
  await requireAuth();

  // Validate class data
  const validation = createClassSchema.safeParse({
    name: data.name,
    classroom: data.classroom,
    code: data.code,
    timing: data.timing,
    dates: data.dates,
    status: data.status,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    await prisma.class.update({
      where: { id: classId },
      data: {
        name: data.name,
        classroom: data.classroom,
        code: data.code,
        timing: data.timing,
        dates: data.dates,
        status: data.status,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating class:', error);
    return { error: 'Failed to update class. Please try again.' };
  }
}
