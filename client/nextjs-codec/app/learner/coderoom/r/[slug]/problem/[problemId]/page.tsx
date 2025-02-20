'use client';

import React from 'react';
import { useParams } from 'next/navigation';

// Import the CodeEditor component
import CodeEditor from '@/components/SolveProblem';

export default function Page() {
  const params = useParams<{ slug: string; problemId: string }>();

  return (
    <CodeEditor
      userType="learner"
      roomId={params.slug}
      problemId={params.problemId}
      autoSaveEnabled={true}
    />
  );
}