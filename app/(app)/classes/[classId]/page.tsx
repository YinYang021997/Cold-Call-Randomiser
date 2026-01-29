import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ClassDetail } from '@/components/ClassDetail';

// Helper to format time
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Helper to format date
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Compute status based on end date
function computeStatus(endDate: Date): 'ACTIVE' | 'ARCHIVED' {
  const now = new Date();
  return endDate >= now ? 'ACTIVE' : 'ARCHIVED';
}

export default async function ClassPage({ params }: { params: { classId: string } }) {
  const session = await requireAuth();

  const classData = await prisma.class.findUnique({
    where: {
      id: params.classId,
      userId: session.userId,
    },
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

  // Transform class data with formatted timing and dates
  const transformedClassData = {
    id: classData.id,
    name: classData.name,
    classroom: classData.classroom,
    code: classData.code,
    timing: `${formatTime(classData.startTime)} - ${formatTime(classData.endTime)}`,
    dates: `${formatDate(classData.startDate)} - ${formatDate(classData.endDate)}`,
    status: computeStatus(classData.endDate),
    students: classData.students,
    coldCalls: classData.coldCalls,
  };

  return <ClassDetail classData={transformedClassData} />;
}
