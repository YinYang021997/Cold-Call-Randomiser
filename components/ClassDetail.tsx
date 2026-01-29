'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SlotMachine } from './SlotMachine';
import { HistoryTab } from './HistoryTab';

interface Student {
  id: string;
  name: string;
  uni: string;
}

interface ColdCall {
  id: string;
  calledAt: Date;
  score: number | null;
  notes: string | null;
  student: Student;
}

interface ClassData {
  id: string;
  name: string;
  classroom: string;
  code: string;
  timing: string;
  dates: string;
  status: string;
  students: Student[];
  coldCalls: ColdCall[];
}

interface ClassDetailProps {
  classData: ClassData;
}

export function ClassDetail({ classData }: ClassDetailProps) {
  const [activeTab, setActiveTab] = useState<'cold-call' | 'history'>('cold-call');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Classes
          </Link>
        </div>

        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{classData.name}</h1>
            <div className="flex gap-2">
              <Link
                href={`/classes/${classData.id}/edit`}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Edit Class
              </Link>
              <Link
                href={`/classes/${classData.id}/add-students`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Add Students
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Classroom:</span> {classData.classroom}
            </div>
            <div>
              <span className="font-medium">Code:</span> {classData.code}
            </div>
            <div>
              <span className="font-medium">Timing:</span> {classData.timing}
            </div>
            <div>
              <span className="font-medium">Dates:</span> {classData.dates}
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('cold-call')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'cold-call'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Cold Call
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                History
              </button>
              <Link
                href={`/classes/${classData.id}/stats`}
                className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                Stats →
              </Link>
            </nav>
          </div>

          {activeTab === 'cold-call' && (
            <SlotMachine classId={classData.id} students={classData.students} />
          )}

          {activeTab === 'history' && (
            <HistoryTab coldCalls={classData.coldCalls} />
          )}
        </div>
      </div>
    </div>
  );
}
