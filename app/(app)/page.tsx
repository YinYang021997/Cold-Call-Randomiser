import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { HomePage } from '@/components/HomePage';

export default async function Page() {
  await requireAuth();

  const classes = await prisma.class.findMany({
    include: {
      _count: {
        select: { students: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return <HomePage classes={classes} />;
}
