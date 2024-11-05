// components/CodeEditor.tsx
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

// Extend the Session type to include the user properties we need
interface CustomSession extends Session {
    user?: {
      id?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } | undefined;
  }

interface CodeEditorProps {
  problem: string;
  room: string;
  language: string;
  initialCode?: string;
}

interface SimilarityAlert {
  comparedWithVersionId: string;
  score: number;
  timestamp: Date;
}

export default function CodeEditor({
  problem,
  room,
  language,
  initialCode = ''
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [similarityAlerts, setSimilarityAlerts] = useState<SimilarityAlert[]>([]);
  const { data: session } = useSession() as { data: CustomSession | null };

  useEffect(() => {
    // Check for both code changes and valid user session
    if (!code || 
        code === lastSaved || 
        !session?.user?.id || 
        !session?.user?.name) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/code-versions/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            learner_id: session.user?.id,
            learner: session.user?.name,
            submissionId: `${session.user?.id}_${Date.now()}`,
            code,
            language,
            problem,
            room,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save code version');
        }

        const data = await response.json();
        setLastSaved(code);

        // Handle similarity alerts
        if (data.similarityResults?.length > 0) {
          setSimilarityAlerts(data.similarityResults);
        }
      } catch (error) {
        console.error('Error saving code version:', error);
        // You might want to add error state handling here
      }
    }, 10000); // Autosave every 10 seconds

    return () => clearTimeout(timer);
  }, [code, lastSaved, session, problem, room, language]);

  // Show message if no session is available
  if (!session?.user) {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg">
        Please sign in to use the code editor.
      </div>
    );
  }

  return (
    <div className="relative">
      {similarityAlerts.length > 0 && (
        <div className="absolute top-0 right-0 p-4 bg-yellow-100 rounded-lg shadow">
          <h3 className="text-yellow-800 font-bold">High Code Similarity Detected</h3>
          <ul className="mt-2">
            {similarityAlerts.map((alert, index) => (
              <li key={index} className="text-yellow-700">
                {Math.round(alert.score * 100)}% similar to another submission
              </li>
            ))}
          </ul>
        </div>
      )}
      <textarea
        className="w-full h-96 p-4 font-mono bg-gray-50 border rounded-lg"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Write your code here..."
      />
      <div className="mt-2 text-sm text-gray-500">
        {lastSaved && (
          <span>
            Last saved: {new Date().toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}