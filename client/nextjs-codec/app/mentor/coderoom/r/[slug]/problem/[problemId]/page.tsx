'use client';

import CodeEditor from '@/components/SolveProblem';
import { useParams } from 'next/navigation';

export default function ProblemPage() {
  const params = useParams<{ slug: string; problemId: string }>();
  
  return (
    <CodeEditor
      userType="mentor"
      roomId={params.slug}
      problemId={params.problemId}
    />
  );
}