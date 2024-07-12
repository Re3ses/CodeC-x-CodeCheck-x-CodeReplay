'use client';

import { getUser } from '@/lib/auth';
import { Editor } from '@monaco-editor/react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000/');

export default function Page() {
  const { isPending, isError, error, data } = useQuery({
    queryKey: ['user'],
    queryFn: async () => await getUser(),
  });
  const [code, setCode] = useState<string>();

  useEffect(() => {
    socket.on('response', (data: string) => {
      setCode(data);
    });

    return () => {
      socket.off('response');
    };
  }, []);

  function handleChange(value: any) {
    socket.emit('code-content', value);
  }

  if (isError) {
    return <div>Error {error.message}</div>;
  }

  if (isPending) {
    return <div>Waiting for important bits...</div>;
  }

  return (
    <div className="h-screen">
      {data?.type === 'Mentor' ? 'Mentor options' : 'Learner options'}
      <Editor
        theme="vs-dark"
        height="90vh"
        defaultValue="content here"
        value={code}
        onChange={handleChange}
      />
    </div>
  );
}
