'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import SimilarityLoading from '@/components/SimilarityLoading';
import SequentialSimilarityVisualization from '@/components/SequentialSimilarityVisualization';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CodeSnapshot {
  code: string;
  timestamp: string;
  userId: string;
  problemId?: string;
  roomId?: string;
  submissionId?: string;
  version?: number;
}

interface SnapshotSimilarity {
  fromIndex: number;
  toIndex: number;
  similarity: number;
  codebertScore: number;
}

const LearnerReplayPage = () => {
  const router = useRouter();
  const params = useParams<{ learner_id: string }>();
  
  const [snapshots, setSnapshots] = useState<CodeSnapshot[]>([]);
  const [sequentialSimilarities, setSequentialSimilarities] = useState<SnapshotSimilarity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingSimilarity, setIsFetchingSimilarity] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<CodeSnapshot | null>(null);

  useEffect(() => {
    const fetchLearnerSnapshots = async () => {
      try {
        setLoading(true);
        // Fetch all snapshots
        const response = await fetch(`/api/codereplayV3/code-snapshots?learner_id=${params.learner_id}`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.snapshots)) {
            console.log("data.snapshots", data.snapshots);
          // Sort snapshots by version or timestamp
          const learnerSnapshots = data.snapshots.sort((a: CodeSnapshot, b: CodeSnapshot) => {
            if (a.version && b.version) {
              return a.version - b.version;
            }
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          });
            
          setSnapshots(learnerSnapshots);
          
          // Set the most recent snapshot as selected
          if (learnerSnapshots.length > 0) {
            setSelectedSnapshot(learnerSnapshots[learnerSnapshots.length - 1]);
          }

          // Calculate sequential similarities if there are snapshots
          if (learnerSnapshots.length > 1) {
            await calculateSequentialSimilarities(learnerSnapshots);
          }
        }
      } catch (error) {
        console.error('Error fetching learner snapshots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLearnerSnapshots();
  }, [params.learner_id]);

  const calculateSequentialSimilarities = async (snapshotsToCompare: CodeSnapshot[]) => {
    try {
      setIsFetchingSimilarity(true);
      const response = await fetch('/api/codereplayV3/code-snapshots/sequential-similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshots: snapshotsToCompare,
          learner_id: params.learner_id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Sequential similarity data:', data);
        if (Array.isArray(data.sequentialSimilarities)) {
          setSequentialSimilarities(data.sequentialSimilarities);
        }
      }
    } catch (error) {
      console.error('Sequential similarity calculation error:', error);
    } finally {
      setIsFetchingSimilarity(false);
    }
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-7xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Code Replay Analysis for Learner {params.learner_id}</CardTitle>
              <Button variant="secondary" onClick={() => router.back()}>Back</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Total Versions: {snapshots.length}
              {selectedSnapshot && (
                <> | Latest Update: {new Date(selectedSnapshot.timestamp).toLocaleString()}</>
              )}
            </div>
          </CardContent>
        </Card>

        {isFetchingSimilarity ? (
          <SimilarityLoading />
        ) : (
          <Card>
            <CardContent className="p-6">
              <SequentialSimilarityVisualization 
                snapshots={snapshots}
                sequentialSimilarities={sequentialSimilarities}
                pasteCount={0}
                bigPasteCount={0}
                pastedSnippets={[]}
              />
            </CardContent>
          </Card>
        )}

        {selectedSnapshot && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Current Version ({selectedSnapshot.version})</CardTitle>
            </CardHeader>
            <CardContent>
              <Editor
                height="400px"
                defaultLanguage="javascript"
                value={selectedSnapshot.code}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LearnerReplayPage;