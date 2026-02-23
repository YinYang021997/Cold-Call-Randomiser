import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PresentationView } from '@/components/PresentationView';

export const dynamic = 'force-dynamic';

export default async function PresentPage({ params }: { params: { classId: string } }) {
  await requireAuth();

  const classData = await prisma.class.findUnique({
    where: { id: params.classId },
    include: {
      students: {
        orderBy: { name: 'asc' },
      },
      teams: {
        where: { students: { some: {} } },
        include: {
          students: { orderBy: { name: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!classData) {
    notFound();
  }

  return (
    <PresentationView
      classId={classData.id}
      className={classData.name}
      students={classData.students.map(s => ({
        id: s.id,
        name: s.name,
        uni: s.uni,
      }))}
      teams={classData.teams.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color,
        students: t.students.map(s => ({
          id: s.id,
          name: s.name,
          uni: s.uni,
        })),
      }))}
    />
  );
}
