'use server';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { updateScoreSchema } from '@/lib/validators';

// ── Team CRUD ──────────────────────────────────────────────────────────────

export async function createTeamAction(classId: string, name: string, color: string) {
  const session = await requireAuth();

  try {
    const classData = await prisma.class.findUnique({
      where: { id: classId, userId: session.userId },
    });
    if (!classData) return { error: 'Class not found' };

    const team = await prisma.team.create({
      data: { classId, name: name.trim(), color },
    });
    return { team };
  } catch (error) {
    console.error('Error creating team:', error);
    return { error: 'Failed to create team.' };
  }
}

export async function updateTeamAction(teamId: string, classId: string, name: string, color: string) {
  const session = await requireAuth();

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { class: true },
    });
    if (!team || team.class.userId !== session.userId) return { error: 'Team not found' };

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: { name: name.trim(), color },
    });
    return { team: updated };
  } catch (error) {
    console.error('Error updating team:', error);
    return { error: 'Failed to update team.' };
  }
}

export async function deleteTeamAction(teamId: string, classId: string) {
  const session = await requireAuth();

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { class: true },
    });
    if (!team || team.class.userId !== session.userId) return { error: 'Team not found' };

    // Unassign all students first (onDelete: SetNull handles this in the DB,
    // but we update explicitly so the UI refresh shows correct state)
    await prisma.student.updateMany({
      where: { teamId },
      data: { teamId: null },
    });

    await prisma.team.delete({ where: { id: teamId } });
    return { success: true };
  } catch (error) {
    console.error('Error deleting team:', error);
    return { error: 'Failed to delete team.' };
  }
}

export async function assignStudentToTeamAction(
  studentId: string,
  teamId: string | null,
  classId: string,
) {
  const session = await requireAuth();

  try {
    const classData = await prisma.class.findUnique({
      where: { id: classId, userId: session.userId },
    });
    if (!classData) return { error: 'Class not found' };

    await prisma.student.update({
      where: { id: studentId },
      data: { teamId },
    });
    return { success: true };
  } catch (error) {
    console.error('Error assigning student to team:', error);
    return { error: 'Failed to assign student.' };
  }
}

// ── Bulk assignment ────────────────────────────────────────────────────────

export async function autoDistributeStudentsAction(classId: string) {
  const session = await requireAuth();

  try {
    const classData = await prisma.class.findUnique({
      where: { id: classId, userId: session.userId },
      include: {
        students: { where: { teamId: null } },
        teams: true,
      },
    });
    if (!classData) return { error: 'Class not found' };

    const unassigned = classData.students;
    const teams = classData.teams;

    if (teams.length === 0) return { error: 'No teams exist. Create teams first.' };
    if (unassigned.length === 0) return { error: 'All students are already assigned.' };

    // Shuffle students randomly (Fisher-Yates)
    const shuffled = [...unassigned];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Assign round-robin across teams
    const updates = shuffled.map((student, i) => ({
      studentId: student.id,
      teamId: teams[i % teams.length].id,
    }));

    await prisma.$transaction(
      updates.map(({ studentId, teamId }) =>
        prisma.student.update({ where: { id: studentId }, data: { teamId } }),
      ),
    );

    return { assignments: updates };
  } catch (error) {
    console.error('Error auto-distributing students:', error);
    return { error: 'Failed to distribute students.' };
  }
}

// ── Team cold call ─────────────────────────────────────────────────────────

export async function spinTeamColdCallAction(classId: string, excludeTeamIds: string[] = []) {
  const session = await requireAuth();

  try {
    const classData = await prisma.class.findUnique({
      where: { id: classId, userId: session.userId },
    });
    if (!classData) return { error: 'Class not found' };

    // Only consider teams that have at least one student, excluding already-called teams in session
    const teams = await prisma.team.findMany({
      where: {
        classId,
        students: { some: {} },
        ...(excludeTeamIds.length > 0 ? { id: { notIn: excludeTeamIds } } : {}),
      },
      include: { students: true },
    });

    if (teams.length === 0) return { error: 'No teams with students found' };

    const selectedTeam = teams[Math.floor(Math.random() * teams.length)];
    const selectedStudent =
      selectedTeam.students[Math.floor(Math.random() * selectedTeam.students.length)];

    await prisma.coldCall.create({
      data: { classId, studentId: selectedStudent.id, teamId: selectedTeam.id },
    });

    return {
      team: { id: selectedTeam.id, name: selectedTeam.name, color: selectedTeam.color },
      student: { id: selectedStudent.id, name: selectedStudent.name, uni: selectedStudent.uni },
    };
  } catch (error) {
    console.error('Error spinning team cold call:', error);
    return { error: 'Failed to select team. Please try again.' };
  }
}

// ── Individual spin ────────────────────────────────────────────────────────

export async function spinSlotMachineAction(classId: string) {
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
  const session = await requireAuth();

  // Validate input
  const validation = updateScoreSchema.safeParse({ coldCallId, score });

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    // Verify cold call belongs to a class owned by user
    const coldCall = await prisma.coldCall.findUnique({
      where: { id: coldCallId },
      include: { class: true },
    });

    if (!coldCall || coldCall.class.userId !== session.userId) {
      return { error: 'Cold call not found' };
    }

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
