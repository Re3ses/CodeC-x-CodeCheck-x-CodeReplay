'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// Import the CodeEditor component
import CodeEditor from '@/components/SolveProblem';

export default function Page() {
  const params = useParams<{ slug: string; problemId: string }>();

  // Get room function
  const [room, setRoom] = useState<any>(null);

  useEffect(() => {
    try {
      const getRoom = async () => {
        const res = await fetch(`/api/rooms?slug=${params.slug}`);
        const data = await res.json();
        setRoom(data.room);
      };
      getRoom();
      console.log('Room data:', room);
    } catch (error) {
      console.error('Failed to fetch room data:', error);
    }
  }, []);

  return (
    <CodeEditor
      userType="learner"
      roomId={params.slug}
      problemId={params.problemId}
    />
  );
}