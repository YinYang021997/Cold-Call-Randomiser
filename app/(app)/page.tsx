import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { HomePage } from '@/components/HomePage';

export const dynamic = 'force-dynamic';

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

export default async function Page() {
  const session = await requireAuth();

  const [classes, user] = await Promise.all([
    prisma.class.findMany({
      where: {
        userId: session.userId,
      },
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { firstName: true },
    }),
  ]);

  // Transform classes to include formatted timing and dates
  const transformedClasses = classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    classroom: cls.classroom,
    code: cls.code,
    timing: `${formatTime(cls.startTime)} - ${formatTime(cls.endTime)}`,
    dates: `${formatDate(cls.startDate)} - ${formatDate(cls.endDate)}`,
    status: computeStatus(cls.endDate),
    _count: cls._count,
  }));

  return <HomePage classes={transformedClasses} firstName={user?.firstName || 'there'} />;
}
