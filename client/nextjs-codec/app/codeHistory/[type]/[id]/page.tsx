'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import SimilarityLoading from '@/components/SimilarityLoading';
import SequentialSimilarityVisualization from '@/components/SequentialSimilarityVisualization';
import { getUser } from '@/lib/auth';
import Nav from '@/app/dashboard/nav';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SafeHtml from '@/components/SafeHtml';
import { GetProblems, GetRoom } from '@/utilities/apiService';

import type { ProblemSchemaInferredType } from '@/lib/interface/problem';
import type { RoomSchemaInferredType } from '@/lib/interface/room';
import type { SubmissionSchemaInferredType } from '@/lib/interface/submissions';

interface CodeSnapshot {
    code: string;
    timestamp: string;
    userId: string;
    version?: number;
    attemptCount: number;
}

interface SnapshotSimilarity {
    fromIndex: number;
    toIndex: number;
    similarity: number;
    codebertScore: number;
}

const ReplayView = ({ submission, onClose }: { 
    submission: SubmissionSchemaInferredType;
    onClose: () => void 
}) => {
    const [snapshots, setSnapshots] = useState<CodeSnapshot[]>([]);
    const [sequentialSimilarities, setSequentialSimilarities] = useState<SnapshotSimilarity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetchingSimilarity, setIsFetchingSimilarity] = useState(false);
    const [selectedSnapshot, setSelectedSnapshot] = useState<CodeSnapshot | null>(null);

    useEffect(() => {
        const fetchLearnerSnapshots = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `/api/codereplayV3/code-snapshots?learner_id=${submission.learner_id}`
                );
                const data = await response.json();

                if (data.success && Array.isArray(data.snapshots)) {
                    const sortedSnapshots = data.snapshots.sort((a: CodeSnapshot, b: CodeSnapshot) => {
                        if (a.version && b.version) {
                            return a.version - b.version;
                        }
                        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                    });

                    setSnapshots(sortedSnapshots);
                    setSelectedSnapshot(sortedSnapshots.length > 0 ? sortedSnapshots[sortedSnapshots.length - 1] : null);

                    if (sortedSnapshots.length > 1) {
                        await calculateSequentialSimilarities(sortedSnapshots);
                    }
                }
            } catch (error) {
                console.error('Error fetching learner snapshots:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLearnerSnapshots();
    }, [submission.learner_id]);

    const calculateSequentialSimilarities = async (snapshotsToCompare: CodeSnapshot[]) => {
        try {
            setIsFetchingSimilarity(true);
            const response = await fetch('/api/codereplayV3/code-snapshots/sequential-similarity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    snapshots: snapshotsToCompare,
                    learnerId: submission.learner_id,
                }),
            });

            if (response.ok) {
                const data = await response.json();
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
        return <div className="h-full w-full flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="space-y-4 h-full overflow-y-auto p-6">
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Code Replay Analysis for {submission.learner}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        Total Versions: {snapshots.length}
                        {selectedSnapshot && (
                            <> | Latest Update: {new Date(selectedSnapshot.timestamp).toLocaleString()}</>
                        )}
                        <> | Attempt: {submission.attempt_count}</>
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
    );
};

const SubmissionViewer = () => {
    const router = useRouter();
    const params = useParams<{ type: string; id: string }>();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>();
    const [submissions, setSubmissions] = useState<SubmissionSchemaInferredType[]>([]);
    const [additionalInfo, setAdditionalInfo] = useState<ProblemSchemaInferredType | RoomSchemaInferredType>();
    const [selectedSubmission, setSelectedSubmission] = useState<SubmissionSchemaInferredType | null>(null);

    useEffect(() => {
        const initialize = async () => {
            try {
                const userData = await getUser();
                if ('error' in userData || userData.message === 'Authentication failed: [JWT MALFORMED]') {
                    router.push('/login');
                    return;
                }
                setUser(userData);

                const queryParam = params.type === 'problem' ?
                    `problem_slug=${params.id}` :
                    `room_id=${params.id}`;
                const response = await fetch(`/api/userSubmissions?${queryParam}&all=true&single=true`);
                const submissionsData = await response.json();
                setSubmissions(submissionsData.submission);
                console.log("submissions: ", submissionsData.submission);

                const info = params.type === 'problem' ?
                    await GetProblems(params.id) :
                    await GetRoom(params.id);
                setAdditionalInfo(info);
            } catch (error) {
                console.error('Initialization error:', error);
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, [params.type, params.id, router]);

    const handleShowReplay = (submission: SubmissionSchemaInferredType) => {
        console.log("submission history:", submission);
        setSelectedSubmission(selectedSubmission?.learner_id === submission.learner_id ? null : submission);
    };

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-background">
            <Nav type={user?.type} name={user?.auth.username} />

            <div className="container mx-auto p-6">
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>
                                <SafeHtml html={additionalInfo?.name ?? ''} />
                            </CardTitle>
                            <Button onClick={() => router.back()} variant="secondary">Back</Button>
                        </div>
                        <SafeHtml html={additionalInfo?.description ?? ''} />
                    </CardHeader>
                </Card>

                <div className="flex gap-6">
                    <div className="w-80 shrink-0 h-[calc(100vh-16rem)] overflow-y-auto">
                        <div className="space-y-4">
                            {submissions.map((submission) => (
                                <Card
                                    key={`${submission.learner_id}-${submission.attempt_count}`}
                                    className={`p-4 transition-colors ${selectedSubmission?.learner_id === submission.learner_id
                                        ? 'bg-muted border-primary'
                                        : ''
                                    }`}
                                >
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-semibold">{submission.learner}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Latest: {new Date(submission.submission_date).toLocaleDateString()}
                                            <br />
                                            Attempts: {submission.attempt_count}
                                        </p>
                                        <Button
                                            variant={selectedSubmission?.learner_id === submission.learner_id ? "default" : "secondary"}
                                            onClick={() => handleShowReplay(submission)}
                                            className="w-full"
                                        >
                                            {selectedSubmission?.learner_id === submission.learner_id ? 'Hide Replay' : 'View Replay'}
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 h-[calc(100vh-16rem)]">
                        {selectedSubmission ? (
                            <ReplayView
                                submission={selectedSubmission}
                                onClose={() => setSelectedSubmission(null)}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                Select a learner to view their code replay
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubmissionViewer;