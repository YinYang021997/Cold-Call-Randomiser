'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Papa from 'papaparse';
import { createClassAction } from './actions';

interface Student {
  name: string;
  uni: string;
}

export default function NewClassPage() {
  const [name, setName] = useState('');
  const [classroom, setClassroom] = useState('');
  const [code, setCode] = useState('');
  const [timing, setTiming] = useState('');
  const [dates, setDates] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [students, setStudents] = useState<Student[]>([]);
  const [csvError, setCsvError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setCsvError('File size must be less than 5MB');
      return;
    }

    setCsvError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];

        // Validate headers
        const headers = Object.keys(data[0] || {}).map(h => h.toLowerCase().trim());
        if (!headers.includes('name') || !headers.includes('uni')) {
          setCsvError('CSV must have "name" and "uni" columns');
          return;
        }

        // Parse and validate students
        const parsedStudents: Student[] = [];
        const errors: string[] = [];

        data.forEach((row, idx) => {
          const name = (row.name || row.Name || row.NAME || '').trim();
          const uni = (row.uni || row.UNI || row.Uni || '').trim();

          if (!name || !uni) {
            errors.push(`Row ${idx + 2}: Missing name or UNI`);
          } else {
            parsedStudents.push({ name, uni });
          }
        });

        if (errors.length > 0) {
          setCsvError(errors.join(', '));
        } else {
          setStudents(prev => [...prev, ...parsedStudents]);
          setCsvError('');
        }
      },
      error: (error) => {
        setCsvError(`Failed to parse CSV: ${error.message}`);
      },
    });

    // Clear the input
    e.target.value = '';
  };

  const addManualStudent = () => {
    setStudents(prev => [...prev, { name: '', uni: '' }]);
  };

  const updateStudent = (index: number, field: 'name' | 'uni', value: string) => {
    setStudents(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeStudent = (index: number) => {
    setStudents(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (students.length === 0) {
      setError('Please add at least one student');
      return;
    }

    // Validate all students
    const invalidStudents = students.filter(s => !s.name.trim() || !s.uni.trim());
    if (invalidStudents.length > 0) {
      setError('All students must have a name and UNI');
      return;
    }

    setLoading(true);

    try {
      const result = await createClassAction({
        name,
        classroom,
        code,
        timing,
        dates,
        status,
        students: students.map(s => ({ name: s.name.trim(), uni: s.uni.trim() })),
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else if (result.classId) {
        router.push(`/classes/${result.classId}`);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Classes
          </Link>
        </div>

        <div className="card">
          <h1 className="text-2xl font-bold mb-6">Create New Class</h1>

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

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">Students</h2>

              <div className="mb-4 flex gap-3">
                <div>
                  <label className="btn-primary cursor-pointer">
                    Upload CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    CSV must have columns: name, uni
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addManualStudent}
                  className="btn-secondary"
                >
                  Add Student Manually
                </button>
              </div>

              {csvError && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4 text-sm">
                  {csvError}
                </div>
              )}

              {students.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {students.length} student{students.length !== 1 ? 's' : ''} added
                  </p>

                  <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                    {students.map((student, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={student.name}
                          onChange={(e) => updateStudent(idx, 'name', e.target.value)}
                          placeholder="Name"
                          className="input-field flex-1"
                        />
                        <input
                          type="text"
                          value={student.uni}
                          onChange={(e) => updateStudent(idx, 'uni', e.target.value)}
                          placeholder="UNI"
                          className="input-field w-32"
                        />
                        <button
                          type="button"
                          onClick={() => removeStudent(idx)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Link href="/" className="btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Creating...' : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
