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
    />
  );
}
