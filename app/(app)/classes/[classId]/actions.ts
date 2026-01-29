'use server';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { updateScoreSchema } from '@/lib/validators';

export async function spinSlotMachineAction(classId: string) {
  await requireAuth();

  try {
    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId },
    });

    if (students.length === 0) {
      return { error: 'No students in this class' };
    }

    // Randomly select a student using crypto for better randomness
    const randomIndex = Math.floor(Math.random() * students.length);
    const selectedStudent = students[randomIndex];

    // Create a cold call record
    await prisma.coldCall.create({
      data: {
        classId,
        studentId: selectedStudent.id,
      },
    });

    return {
      student: {
        id: selectedStudent.id,
        name: selectedStudent.name,
        uni: selectedStudent.uni,
      },
    };
  } catch (error) {
    console.error('Error spinning slot machine:', error);
    return { error: 'Failed to select student. Please try again.' };
  }
}

export async function updateColdCallScoreAction(coldCallId: string, score: number | null) {
  await requireAuth();

  // Validate input
  const validation = updateScoreSchema.safeParse({ coldCallId, score });

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    await prisma.coldCall.update({
      where: { id: coldCallId },
      data: { score },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating score:', error);
    return { error: 'Failed to update score. Please try again.' };
  }
}
