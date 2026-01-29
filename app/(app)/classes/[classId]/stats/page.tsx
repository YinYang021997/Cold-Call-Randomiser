import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { StatsPage } from '@/components/StatsPage';

export const dynamic = 'force-dynamic';

interface StudentStats {
  id: string;
  name: string;
  uni: string;
  timesCalled: number;
  averageScore: number | null;
  cumulativeScore: number;
  lastCalled: Date | null;
}

export default async function Page({ params }: { params: { classId: string } }) {
  const session = await requireAuth();

  const classData = await prisma.class.findUnique({
    where: {
      id: params.classId,
      userId: session.userId,
    },
    include: {
      students: {
        include: {
          coldCalls: {
            select: {
              score: true,
              calledAt: true,
            },
          },
        },
      },
    },
  });

  if (!classData) {
    notFound();
  }

  const studentStats: StudentStats[] = classData.students.map((student) => {
    const coldCalls = student.coldCalls;
    const timesCalled = coldCalls.length;

    const scores = coldCalls.map(cc => cc.score).filter((s): s is number => s !== null);
    const cumulativeScore = scores.reduce((sum, score) => sum + score, 0);
    const averageScore = scores.length > 0 ? cumulativeScore / scores.length : null;

    const lastCalled = coldCalls.length > 0
      ? coldCalls.reduce((latest, cc) => (cc.calledAt > latest ? cc.calledAt : latest), coldCalls[0].calledAt)
      : null;

    return {
      id: student.id,
      name: student.name,
      uni: student.uni,
      timesCalled,
      averageScore,
      cumulativeScore,
      lastCalled,
    };
  });

  studentStats.sort((a, b) => b.cumulativeScore - a.cumulativeScore);

  return (
    <StatsPage
      classId={params.classId}
      className={classData.name}
      studentStats={studentStats}
    />
  );
}
