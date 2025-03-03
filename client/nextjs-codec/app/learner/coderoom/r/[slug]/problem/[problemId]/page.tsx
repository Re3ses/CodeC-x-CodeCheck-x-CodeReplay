'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import CodeEditor from '@/components/SolveProblem';

export default function Page() {
  const params = useParams<{ slug: string; problemId: string }>();

  const roomQuery = useQuery({
    queryKey: ['room', params.slug],
    queryFn: async () => {
      const res = await fetch(`/api/rooms?slug=${params.slug}`);
      const data = await res.json();
      return data.room;
    }
  });

  if (roomQuery.isPending) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (roomQuery.error) {
    return <div>Error loading room: {(roomQuery.error as Error).message}</div>;
  }

  return (
    <CodeEditor
      userType="learner"
      roomId={params.slug}
      problemId={params.problemId}
      dueDate={roomQuery.data?.dueDate}
    />
  );
}