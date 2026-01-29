'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { spinSlotMachineAction } from '@/app/(app)/classes/[classId]/actions';

interface Student {
  id: string;
  name: string;
  uni: string;
}

interface SlotMachineProps {
  classId: string;
  students: Student[];
}

export function SlotMachine({ classId, students }: SlotMachineProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [error, setError] = useState('');
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleSpin = async () => {
    if (isSpinning || students.length === 0) return;

    setError('');
    setSelectedStudent(null);
    setIsSpinning(true);

    try {
      // Start the visual spinning animation
      let currentIndex = 0;
      let speed = 50;

      intervalRef.current = setInterval(() => {
        currentIndex = (currentIndex + 1) % students.length;
        setDisplayIndex(currentIndex);
      }, speed);

      // Get the selected student from server
      const result = await spinSlotMachineAction(classId);

      if (result.error) {
        setError(result.error);
        setIsSpinning(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return;
      }

      if (!result.student) {
        setError('Failed to select a student');
        setIsSpinning(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return;
      }

      // Find the index of the selected student
      const selectedIndex = students.findIndex(s => s.id === result.student!.id);

      // Gradually slow down the animation
      let slowDownSteps = 0;
      const maxSlowDownSteps = 15;

      const slowDown = setInterval(() => {
        speed += 30;
        slowDownSteps++;

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        if (slowDownSteps >= maxSlowDownSteps) {
          clearInterval(slowDown);
          // Stop at the selected student
          setDisplayIndex(selectedIndex);
          setSelectedStudent(result.student!);
          setIsSpinning(false);

          // Trigger confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });

          // Refresh to show updated history
          setTimeout(() => {
            router.refresh();
          }, 1000);
        } else {
          intervalRef.current = setInterval(() => {
            currentIndex = (currentIndex + 1) % students.length;
            setDisplayIndex(currentIndex);
          }, speed);
        }
      }, 100);

    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsSpinning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No students in this class yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Slot Machine Display */}
        <div className="flex-1">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-8 text-white shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-center">Random Student Picker</h2>

            <div className="bg-white rounded-lg p-6 text-gray-900 min-h-[200px] flex flex-col items-center justify-center">
              {selectedStudent ? (
                <div className="text-center animate-pulse">
                  <div className="text-4xl font-bold mb-2">{selectedStudent.name}</div>
                  <div className="text-2xl text-gray-600">{selectedStudent.uni}</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${isSpinning ? 'animate-pulse' : ''}`}>
                    {students[displayIndex]?.name || 'Ready'}
                  </div>
                  <div className="text-xl text-gray-600">
                    {students[displayIndex]?.uni || 'Click to spin'}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isSpinning ? 'Spinning...' : 'Spin & Pick'}
              </button>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-3">
            All Students ({students.length})
          </h3>
          <div className="bg-white border rounded-lg max-h-[400px] overflow-y-auto">
            <div className="divide-y">
              {students.map((student, idx) => (
                <div
                  key={student.id}
                  className={`px-4 py-3 ${
                    displayIndex === idx && isSpinning
                      ? 'bg-blue-50'
                      : selectedStudent?.id === student.id
                      ? 'bg-green-50 font-semibold'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-600">{student.uni}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
