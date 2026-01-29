'use client';

import { useState, useOptimistic } from 'react';
import { updateColdCallScoreAction } from '@/app/(app)/classes/[classId]/actions';

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

interface HistoryTabProps {
  coldCalls: ColdCall[];
}

const scoreOptions = [-2, -1, 0, 1, 2];

export function HistoryTab({ coldCalls }: HistoryTabProps) {
  const [optimisticCalls, setOptimisticCalls] = useOptimistic(
    coldCalls,
    (state, { id, score }: { id: string; score: number | null }) =>
      state.map(call => (call.id === id ? { ...call, score } : call))
  );

  const handleScoreChange = async (coldCallId: string, score: number | null) => {
    setOptimisticCalls({ id: coldCallId, score });

    const result = await updateColdCallScoreAction(coldCallId, score);

    if (result.error) {
      console.error('Error updating score:', result.error);
    }
  };

  if (optimisticCalls.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No cold calls yet. Use the slot machine to select a student!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">
        Cold Call History ({optimisticCalls.length} total)
      </h3>

      <div className="space-y-2">
        {optimisticCalls.map((call) => (
          <div
            key={call.id}
            className="bg-gray-50 border rounded-lg p-4 hover:bg-gray-100 transition-colors"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-baseline gap-3">
                  <div className="font-semibold text-lg">{call.student.name}</div>
                  <div className="text-sm text-gray-600">{call.student.uni}</div>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {new Date(call.calledAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 mr-2">Score:</span>
                <div className="flex gap-1">
                  {scoreOptions.map((scoreValue) => (
                    <button
                      key={scoreValue}
                      onClick={() => handleScoreChange(call.id, scoreValue)}
                      className={`w-10 h-10 rounded-lg font-semibold text-sm transition-colors ${
                        call.score === scoreValue
                          ? scoreValue >= 1
                            ? 'bg-green-500 text-white'
                            : scoreValue === 0
                            ? 'bg-yellow-500 text-white'
                            : 'bg-red-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {scoreValue >= 0 ? '+' : ''}{scoreValue}
                    </button>
                  ))}
                  <button
                    onClick={() => handleScoreChange(call.id, null)}
                    className={`px-3 h-10 rounded-lg font-medium text-sm transition-colors ${
                      call.score === null
                        ? 'bg-gray-300 text-gray-700'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
