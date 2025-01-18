'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Editor } from '@monaco-editor/react';

import { getUser } from '@/lib/auth';
import Nav from '@/app/dashboard/nav';
import BorderedContainer from '@/components/ui/wrappers/BorderedContainer';
import { Button } from '@/components/ui/button';
import SafeHtml from '@/components/SafeHtml';
import { CodeAnalyzer } from '@/utilities/codeAnalyzer';
import { GetProblems, GetRoom } from '@/utilities/apiService';

import type { ProblemSchemaInferredType } from '@/lib/interface/problem';
import type { RoomSchemaInferredType } from '@/lib/interface/room';
import type { SubmissionSchemaInferredType } from '@/lib/interface/submissions';

// Types and Interfaces
interface User {
    _id: number;
    first_name: string;
    last_name: string;
    type: string;
    auth: {
        username: string;
    };
}

interface EditorState {
    value: string;
    historyIndex: number;
    learnerId: string;
}

interface EditorStates {
    editor1: EditorState;
    editor2: EditorState;
}

interface CodeEditorProps {
    value: string;
    height?: string;
}

interface HistoryNavigationProps {
    currentIndex: number;
    onBack: () => void;
    onForward: () => void;
}

interface LearnerSelectorProps {
    submissions: SubmissionSchemaInferredType[];
    selectedLearnerId: string;
    onSelect: (learnerId: string) => void;
    historyIndex: number;
    onHistorySelect: (index: number) => void;
}

interface ComparisonResultsProps {
    comparisons: Record<string, any>;
    selectedLearner1: string;
    selectedLearner2: string;
    historyIndex1: number;
    historyIndex2: number;
    submissions: SubmissionSchemaInferredType[];
}

// Components
const CodeEditor: React.FC<CodeEditorProps> = ({ value, height = "95%" }) => {
    const editorOptions = {
        readOnly: true,
        minimap: { enabled: true },
        fontSize: 14,
        scrollBeyondLastLine: false,
        wordWrap: 'on' as const,
    };

    return (
        <Editor
            height={height}
            className="rounded-lg overflow-clip"
            defaultLanguage="javascript"
            value={value}
            theme="vs-dark"
            options={editorOptions}
        />
    );
};

const HistoryNavigation: React.FC<HistoryNavigationProps> = ({
    currentIndex,
    onBack,
    onForward
}) => (
    <div className="border rounded-sm flex justify-between items-center p-2">
        <div>Current: {currentIndex + 1}</div>
        <div>
            <Button
                variant="ghost"
                className="p-2 hover:bg-gray-700 rounded-sm"
                onClick={onBack}
            >
                Back
            </Button>
            <Button
                variant="ghost"
                className="p-2 hover:bg-gray-700 rounded-sm"
                onClick={onForward}
            >
                Next
            </Button>
        </div>
    </div>
);

const LearnerSelector: React.FC<LearnerSelectorProps> = ({
    submissions,
    selectedLearnerId,
    onSelect,
    historyIndex,
    onHistorySelect
}) => (
    <div className="flex gap-2">
        <div className="border p-2">
            <select
                className=""
                onChange={(e) => onSelect(e.target.value)}
                value={selectedLearnerId}
            >
                <option value="">Select a learner</option>
                {submissions.map(sub => (
                    <option key={sub.learner_id} value={sub.learner_id}>
                        {sub.learner}
                    </option>
                ))}
            </select>
        </div>
        {selectedLearnerId && (
            <div className="border p-2">
                <select
                    className=""
                    onChange={(e) => onHistorySelect(parseInt(e.target.value, 10))}
                    value={historyIndex}
                >
                    {submissions
                        .find(sub => sub.learner_id === selectedLearnerId)
                        ?.history.map((_, index) => (
                            <option key={index} value={index}>
                                {index + 1}
                            </option>
                        ))}
                </select>
            </div>
        )}
    </div>
);

const ComparisonResults: React.FC<ComparisonResultsProps> = ({
    comparisons,
    selectedLearner1,
    selectedLearner2,
    historyIndex1,
    historyIndex2,
    submissions
}) => {
    if (!selectedLearner1 || !selectedLearner2) {
        return <p>Select two learners to see comparison results</p>;
    }

    const learner1 = submissions.find(sub => sub.learner_id === selectedLearner1);
    const learner2 = submissions.find(sub => sub.learner_id === selectedLearner2);

    if (!learner1 || !learner2) return null;

    const snippet1 = learner1.history[historyIndex1];
    const snippet2 = learner2.history[historyIndex2];

    const comparisonResult = comparisons[selectedLearner1]?.[snippet1]?.find(
        (result: any) =>
            result.comparedLearnerId === selectedLearner2 &&
            result.comparedSnippet === snippet2
    );

    if (!comparisonResult) {
        return <p>No significant similarity found between these submissions.</p>;
    }

    return (
        <div className="mt-4 p-4 border rounded-lg">
            <h3 className="font-bold mb-2">Similarity Analysis</h3>
            <p>Similarity Score: {(comparisonResult.similarityScore * 100).toFixed(1)}%</p>
        </div>
    );
};

// Main Component
const SubmissionViewer: React.FC = () => {
    const router = useRouter();
    const params = useParams<{ type: string; id: string }>();

    // State management
    const [loading, setLoading] = useState<boolean>(true);
    const [user, setUser] = useState<User | undefined>();
    const [submissions, setSubmissions] = useState<SubmissionSchemaInferredType[]>([]);
    const [additionalInfo, setAdditionalInfo] = useState<ProblemSchemaInferredType | RoomSchemaInferredType>();
    const [comparisons, setComparisons] = useState<Record<string, any>>({});
    const [comparisonLoading, setComparisonLoading] = useState<boolean>(false);

    // Editor states
    const [editorStates, setEditorStates] = useState<EditorStates>({
        editor1: { value: '', historyIndex: 0, learnerId: '' },
        editor2: { value: '', historyIndex: 0, learnerId: '' }
    });

    // Data fetching
    useEffect(() => {
        const initialize = async () => {
            try {
                // Fetch user data
                const userData = await getUser();
                if ('error' in userData || userData.message === 'Authentication failed: [JWT MALFORMED]') {
                    router.push('/login');
                    return;
                }
                setUser(userData as User);

                // Fetch submissions
                const queryParam = params.type === 'problem' ?
                    `problem_slug=${params.id}` :
                    `room_id=${params.id}`;
                const response = await fetch(`/api/userSubmissions?${queryParam}&all=true&single=true`);
                const submissionsData = await response.json();
                setSubmissions(submissionsData.submission);

                // Fetch additional info
                const info = params.type === 'problem' ?
                    await GetProblems(params.id) :
                    await GetRoom(params.id);
                setAdditionalInfo(info);

                // Analyze code
                if (submissionsData.submission.length > 0) {
                    setComparisonLoading(true);
                    const analysisResult = await CodeAnalyzer.compareSubmissions(submissionsData.submission);
                    setComparisons(analysisResult);
                    setComparisonLoading(false);
                }
            } catch (error) {
                console.error('Initialization error:', error);
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, [params.type, params.id, router]);

    const updateEditorState = (
        editorKey: keyof EditorStates,
        updates: Partial<EditorState>
    ) => {
        setEditorStates(prev => ({
            ...prev,
            [editorKey]: { ...prev[editorKey], ...updates }
        }));
    };

    const handleLearnerSelect = (editorKey: keyof EditorStates) => (learnerId: string) => {
        const submission = submissions.find(sub => sub.learner_id === learnerId);
        if (submission) {
            updateEditorState(editorKey, {
                learnerId,
                value: submission.code,
                historyIndex: 0
            });
        }
    };

    const handleHistoryNavigation = (
        editorKey: keyof EditorStates,
        direction: 'back' | 'forward'
    ) => {
        const currentState = editorStates[editorKey];
        const submission = submissions.find(sub => sub.learner_id === currentState.learnerId);

        if (!submission) return;

        const maxIndex = submission.history.length - 1;
        const newIndex = direction === 'back'
            ? Math.max(0, currentState.historyIndex - 1)
            : Math.min(maxIndex, currentState.historyIndex + 1);

        updateEditorState(editorKey, {
            historyIndex: newIndex,
            value: submission.history[newIndex]
        });
    };

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="h-screen w-screen flex flex-col">
            <Nav type={user?.type} name={user?.auth.username} />

            <main className="flex-grow flex flex-col justify-center w-5/6 max-w-screen-2xl items-center self-center">
                <BorderedContainer customStyle="w-full max-w-screen-2xl flex justify-between p-2">
                    <div>
                        <SafeHtml className="font-bold" html={additionalInfo?.name ?? ''} />
                        <SafeHtml html={additionalInfo?.description ?? ''} />
                    </div>
                    <Button onClick={() => router.back()} variant="secondary">Back</Button>
                </BorderedContainer>

                <div className="flex justify-center w-full h-fit items-center self-center gap-4">
                    {/* Code Editors */}
                    <BorderedContainer customStyle="p-4 flex-grow h-[80vh] flex flex-col gap-2">
                        <div className="flex flex-col gap-2 h-1/2">
                            <HistoryNavigation
                                currentIndex={editorStates.editor1.historyIndex}
                                onBack={() => handleHistoryNavigation('editor1', 'back')}
                                onForward={() => handleHistoryNavigation('editor1', 'forward')}
                            />
                            <CodeEditor value={editorStates.editor1.value} />
                        </div>

                        <div className="flex flex-col gap-2 h-1/2">
                            <HistoryNavigation
                                currentIndex={editorStates.editor2.historyIndex}
                                onBack={() => handleHistoryNavigation('editor2', 'back')}
                                onForward={() => handleHistoryNavigation('editor2', 'forward')}
                            />
                            <CodeEditor value={editorStates.editor2.value} />
                        </div>
                    </BorderedContainer>

                    {/* Results Panel */}
                    <BorderedContainer customStyle="p-2 min-w-[15rem] h-[80vh]">
                        <h2 className="font-bold mb-4">Results</h2>
                        {comparisonLoading ? (
                            <p>Analyzing submissions...</p>
                        ) : (null
                        )}
                        <div className="flex flex-col gap-4">
                            <LearnerSelector
                                submissions={submissions}
                                selectedLearnerId={editorStates.editor1.learnerId}
                                onSelect={handleLearnerSelect('editor1')}
                                historyIndex={editorStates.editor1.historyIndex}
                                onHistorySelect={(index) => updateEditorState('editor1', { historyIndex: index })}
                            />
                            <LearnerSelector
                                submissions={submissions}
                                selectedLearnerId={editorStates.editor2.learnerId}
                                onSelect={handleLearnerSelect('editor2')}
                                historyIndex={editorStates.editor2.historyIndex}
                                onHistorySelect={(index) => updateEditorState('editor2', { historyIndex: index })}
                            />
                            <ComparisonResults
                                comparisons={comparisons}
                                selectedLearner1={editorStates.editor1.learnerId}
                                selectedLearner2={editorStates.editor2.learnerId}
                                historyIndex1={editorStates.editor1.historyIndex}
                                historyIndex2={editorStates.editor2.historyIndex}
                                submissions={submissions}
                            />
                        </div>
                    </BorderedContainer>
                </div>
            </main>
        </div>
    );
};

export default SubmissionViewer;