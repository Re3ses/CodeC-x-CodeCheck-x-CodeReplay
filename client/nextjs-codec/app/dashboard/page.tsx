'use client';

import { useState } from 'react';

export default function Page() {
  const [studentCount, setStudentCount] = useState<number>();
  const [classroomCount, setClassroomCount] = useState<number>();
  const [problemCount, setProblemCount] = useState<number>();

  return (
    <div className="m-4 flex gap-4">
      {/* Classroom */}
      <div className="w-fit rounded-xl border border-[gray]/50 bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">
            Classrooms created
          </h3>
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">0</div>
        </div>
      </div>

      {/* Students */}
      <div className="w-fit rounded-xl border border-[gray]/50 bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">
            Students managed
          </h3>
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">0</div>
        </div>
      </div>

      {/* Problems created */}
      <div className="w-fit rounded-xl border border-[gray]/50 bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">
            Problems created
          </h3>
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">0</div>
        </div>
      </div>
    </div>
  );
}
