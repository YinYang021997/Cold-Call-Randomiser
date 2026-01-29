import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ClassDetail } from '@/components/ClassDetail';

export default async function ClassPage({ params }: { params: { classId: string } }) {
  await requireAuth();

  const classData = await prisma.class.findUnique({
    where: { id: params.classId },
    include: {
      students: {
        orderBy: { name: 'asc' },
      },
      coldCalls: {
        include: { student: true },
        orderBy: { calledAt: 'desc' },
      },
    },
  });

  if (!classData) {
    notFound();
  }

  return <ClassDetail classData={classData} />;
}
