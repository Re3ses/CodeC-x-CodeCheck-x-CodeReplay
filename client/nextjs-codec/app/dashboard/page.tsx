'use client';

import { useContext, useEffect, useState } from 'react';
import { UserContext } from './contexts';
import { UserSchemaInferredType } from '../../lib/interface/user';

export default function Page(props: { props: any }) {
  const user: UserSchemaInferredType = useContext(UserContext)!;

  const [studentCount, setStudentCount] = useState<number>();
  const [coderoomsCount, setCoderoomsCount] = useState<number>();
  const [problemCount, setProblemCount] = useState<number>();

  useEffect(() => {
    const res = async () => {
      const res = await fetch(`/api/metrics`).then(async (value) => {
        const { created_coderooms_count, created_problems_count } =
          await value.json();
        setCoderoomsCount(created_coderooms_count);
        setProblemCount(created_problems_count);
      });
    };

    res();

    console.log('from user context: ', user);
  }, [user]);

  return (
    <div className="m-4 flex gap-4">
      {/* Classroom */}
      <div className="w-fit rounded-xl border border-[gray]/50 bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">
            {user.type === 'Learner' ? 'Coderooms Joined' : 'Coderooms Created'}
          </h3>
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">{coderoomsCount}</div>
        </div>
      </div>

      {/* Students */}

      {/* <div className="w-fit rounded-xl border border-[gray]/50 bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">
            Students managed
          </h3>
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">0</div>
        </div>
      </div> */}

      {/* Problems created */}
      <div className="w-fit rounded-xl border border-[gray]/50 bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">
            Problems created
          </h3>
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">{problemCount}</div>
        </div>
      </div>
    </div>
  );
}
