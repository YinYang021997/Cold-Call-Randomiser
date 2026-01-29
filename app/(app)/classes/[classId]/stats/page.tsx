import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface StudentStats {
  id: string;
  name: string;
  uni: string;
  timesCalled: number;
  averageScore: number | null;
  cumulativeScore: number;
  lastCalled: Date | null;
}

export default async function StatsPage({ params }: { params: { classId: string } }) {
  await requireAuth();

  const classData = await prisma.class.findUnique({
    where: { id: params.classId },
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

  // Calculate stats for each student
  const studentStats: StudentStats[] = classData.students.map((student) => {
    const coldCalls = student.coldCalls;
    const timesCalled = coldCalls.length;

    // Calculate scores
    const scores = coldCalls.map(cc => cc.score).filter((s): s is number => s !== null);
    const cumulativeScore = scores.reduce((sum, score) => sum + score, 0);
    const averageScore = scores.length > 0 ? cumulativeScore / scores.length : null;

    // Find last called date
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

  // Sort by cumulative score descending by default
  studentStats.sort((a, b) => b.cumulativeScore - a.cumulativeScore);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href={`/classes/${params.classId}`} className="text-blue-600 hover:text-blue-800">
            ← Back to Class
          </Link>
        </div>

        <div className="card">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{classData.name}</h1>
            <h2 className="text-xl text-gray-600 mt-2">Student Statistics</h2>
          </div>

          {studentStats.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No students in this class yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UNI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Times Called
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cumulative Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Called
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studentStats.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.uni}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.timesCalled}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-semibold ${
                            student.cumulativeScore > 0
                              ? 'text-green-600'
                              : student.cumulativeScore < 0
                              ? 'text-red-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {student.cumulativeScore >= 0 ? '+' : ''}{student.cumulativeScore}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.averageScore !== null
                            ? `${student.averageScore >= 0 ? '+' : ''}${student.averageScore.toFixed(2)}`
                            : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.lastCalled
                            ? new Date(student.lastCalled).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
