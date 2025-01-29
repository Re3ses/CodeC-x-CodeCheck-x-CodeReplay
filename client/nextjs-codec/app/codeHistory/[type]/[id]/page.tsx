'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { getUser } from '@/lib/auth';
import Nav from '@/app/dashboard/nav';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SafeHtml from '@/components/SafeHtml';
import { GetProblems, GetRoom } from '@/utilities/apiService';

import type { ProblemSchemaInferredType } from '@/lib/interface/problem';
import type { RoomSchemaInferredType } from '@/lib/interface/room';
import type { SubmissionSchemaInferredType } from '@/lib/interface/submissions';

const SubmissionViewer = () => {
    const router = useRouter();
    const params = useParams<{ type: string; id: string }>();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>();
    const [submissions, setSubmissions] = useState<SubmissionSchemaInferredType[]>([]);
    const [additionalInfo, setAdditionalInfo] = useState<ProblemSchemaInferredType | RoomSchemaInferredType>();
    const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);

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

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-background">
            <Nav type={user?.type} name={user?.auth.username} />

            <main className="container mx-auto p-6 max-w-4xl">
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>
                            <SafeHtml html={additionalInfo?.name ?? ''} />
                        </CardTitle>
                        <SafeHtml html={additionalInfo?.description ?? ''} />
                    </CardHeader>
                </Card>

                <div className="grid gap-4">
                    {submissions.map((submission) => (
                        <Card key={submission.learner_id} className="p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold">{submission.learner}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Latest submission: {new Date(submission.submission_date).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Total versions: {submission.history.length}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setSelectedSubmission(
                                            selectedSubmission === submission.learner_id ? null : submission.learner_id
                                        )}
                                    >
                                        {selectedSubmission === submission.learner_id ? 'Hide History' : 'View History'}
                                    </Button>
                                    <Link
                                        href={`/codeHistory/${params.type}/${params.id}/replay/${submission.learner_id}`}
                                        className={buttonVariants({
                                            variant: 'secondary'
                                        })}
                                    >
                                        View Replay
                                    </Link>
                                </div>
                            </div>

                            {selectedSubmission === submission.learner_id && (
                                <div className="mt-4 space-y-4">
                                    {submission.history.map((code, index) => (
                                        <Card key={index} className="p-4 bg-muted">
                                            <p className="text-sm font-medium mb-2">
                                                Version {submission.history.length - index}
                                            </p>
                                            <pre className="text-sm overflow-x-auto p-2 bg-background rounded">
                                                {code}
                                            </pre>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                    <Button onClick={() => router.back()} variant="secondary">Back</Button>
                </div>
            </main>
        </div>
    );
};

export default SubmissionViewer;