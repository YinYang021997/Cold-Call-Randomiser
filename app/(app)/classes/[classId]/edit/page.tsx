'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateClassAction, getClassAction } from './actions';

interface ClassData {
  id: string;
  name: string;
  classroom: string;
  code: string;
  timing: string;
  dates: string;
  status: string;
}

export default function EditClassPage({ params }: { params: { classId: string } }) {
  const [name, setName] = useState('');
  const [classroom, setClassroom] = useState('');
  const [code, setCode] = useState('');
  const [timing, setTiming] = useState('');
  const [dates, setDates] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadClass = async () => {
      const result = await getClassAction(params.classId);
      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else if (result.class) {
        setName(result.class.name);
        setClassroom(result.class.classroom);
        setCode(result.class.code);
        setTiming(result.class.timing);
        setDates(result.class.dates);
        setStatus(result.class.status as 'ACTIVE' | 'ARCHIVED');
        setLoading(false);
      }
    };
    loadClass();
  }, [params.classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const result = await updateClassAction(params.classId, {
        name,
        classroom,
        code,
        timing,
        dates,
        status,
      });

      if (result.error) {
        setError(result.error);
        setSaving(false);
      } else {
        router.push(`/classes/${params.classId}`);
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href={`/classes/${params.classId}`} className="text-blue-600 hover:text-blue-800">
            ← Back to Class
          </Link>
        </div>

        <div className="card">
          <h1 className="text-2xl font-bold mb-6">Edit Class</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classroom *
                </label>
                <input
                  type="text"
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Code *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timing *
                </label>
                <input
                  type="text"
                  value={timing}
                  onChange={(e) => setTiming(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Weds 10:10–11:30"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dates *
                </label>
                <input
                  type="text"
                  value={dates}
                  onChange={(e) => setDates(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Jan 22 – May 2, 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'ARCHIVED')}
                  className="input-field"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Link href={`/classes/${params.classId}`} className="btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
