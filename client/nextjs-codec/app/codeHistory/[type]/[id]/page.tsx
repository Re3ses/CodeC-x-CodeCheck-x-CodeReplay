'use client';
import { use, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Nav from '@/app/dashboard/nav';
import BorderedContainer from '@/components/ui/wrappers/BorderedContainer';
import { Editor } from '@monaco-editor/react';
import { ProblemSchemaInferredType } from '@/lib/interface/problem';
import { RoomSchemaInferredType } from '@/lib/interface/room';
import { GetProblems } from '@/utilities/apiService';
import { GetRoom } from '@/utilities/apiService';
import SafeHtml from '@/components/SafeHtml';
import { Button } from '@/components/ui/button';

interface User {
    _id: number;
    first_name: string;
    last_name: string;
    type: string;
    auth: {
        username: string;
    };
}

interface Submission {
    _id: string;
    language_used: string;
    code: string;
    history: string[];
    score: number;
    score_overall_count: number;
    verdict: string;
    learner: string;
    learner_id: string;
    problem: string;
    room: string;
    attempt_count: number;
    start_time: number;
    end_time: number;
    completion_time: number;
    most_similar: string | null;
    submission_date: string;
    __v: number;
}


export default function Page() {
    const router = useRouter();

    const params = useParams<{ type: string, id: string }>();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [user, setUser] = useState<User>();
    const [editorValue, setEditorValue] = useState('');
    const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
    const [additionalInfo, setAdditionalInfo] = useState<ProblemSchemaInferredType | RoomSchemaInferredType>();
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        // Get user/login
        const req = async () => {
            await getUser().then((val) => {
                setUser(val);
                if (
                    val.error ||
                    val.message === 'Authentication failed: [JWT MALFORMED]'
                ) {
                    router.push('/login');
                }
            });
        };
        req();

        // Fetch room data
        const fetchData = async () => {
            if (params.type === "problem") {
                await fetch(`/api/userSubmissions?problem_slug=${params.id}&all=true&single=true`).then(
                    async (val) => {
                        await val.json().then((data) => {
                            setSubmissions(data.submission);
                        });
                    }
                );

                const res: () => Promise<ProblemSchemaInferredType> = async () => {
                    return await GetProblems(params.id);
                };
                res().then((result) => setAdditionalInfo(result));
            } else if (params.type === "coderoom") {
                await fetch(`/api/userSubmissions?room_id=${params.id}&all=true&single=true`).then(
                    async (val) => {
                        await val.json().then((data) => {
                            setSubmissions(data.submission);
                        });
                    }
                );

                const res: () => Promise<RoomSchemaInferredType> = async () => {
                    return await GetRoom(params.id);
                };
                res().then((result) => setAdditionalInfo(result));
            }
        };
        console.log("submissions:", submissions);
        fetchData();

        setLoading(false);
    }, [params.type, params.id, router]);

    const handleSubmissionClick = (submission: Submission) => {
        setEditorValue(submission.code);
        console.log(submission.history);
        setCurrentHistoryIndex(submission.history.length - 1);
    };

    const handleBackClick = () => {
        setCurrentHistoryIndex((prevIndex) => {
            const newIndex = Math.max(prevIndex - 1, 0);
            setEditorValue(submissions[currentSubmissionIndex].history[newIndex]);
            return newIndex;
        });
    };

    const handleForwardClick = () => {
        setCurrentHistoryIndex((prevIndex) => {
            const newIndex = Math.min(prevIndex + 1, submissions[currentSubmissionIndex].history.length - 1);
            setEditorValue(submissions[currentSubmissionIndex].history[newIndex]);
            return newIndex;
        });
    };

    return (
        <div className="h-screen w-screen flex flex-col">
            {/* Nav section */}
            {loading ? null : <Nav type={user?.type} name={user?.auth.username} />}

            {loading ? null :
                <div className="flex-grow flex flex-col justify-center w-5/6 max-w-screen-2xl items-center self-center">
                    <BorderedContainer customStyle='w-full max-w-screen-2xl flex justify-between p-2'>
                        <div>
                            <SafeHtml
                                className="font-bold"
                                html={additionalInfo?.name!}
                            />
                            <SafeHtml html={additionalInfo?.description!} />
                        </div>
                        <Button onClick={() => router.back()} variant="secondary">Back</Button>
                    </BorderedContainer>

                    <div className='flex justify-center w-full h-fit items-center self-center'>

                        {/* Submissions container */}
                        <BorderedContainer customStyle="p-2 w-1/6 min-w-[15rem] h-[80vh]  flex flex-col gap-2 content-stretch items-center">
                            <h1 className="font-bold">Submissions</h1>
                            <div className='flex-grow w-full rounded border border-white overflow-clip'>
                                <div className="flex-grow h-full flex flex-col justify-start overflow-y-scroll bg-muted/50">
                                    {submissions.map((submission, i) => (
                                        <div key={i}
                                            className="font-medium border border-white hover:bg-gray-700 p-1 pointer-events-auto"
                                            onClick={() => {
                                                setCurrentSubmissionIndex(i);
                                                handleSubmissionClick(submission);
                                            }}>
                                            <h2 className='pointer-events-none'>
                                                {submission.learner}
                                            </h2>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </BorderedContainer>

                        {/* Editor container */}
                        <BorderedContainer customStyle="p-4 flex-grow flex-col h-[80vh] gap-2 overflow-hidden">
                            <div className='bg-blue-500 flex justify-between items-center'>
                                <div>Current: {currentHistoryIndex}</div>
                                <div>
                                    <button className="p-2 hover:bg-gray-700 rounded-sm" onClick={handleBackClick}>
                                        {"Back"}
                                    </button>
                                    <button className="p-2 hover:bg-gray-700 rounded-sm" onClick={handleForwardClick}>
                                        {"Next"}
                                    </button>
                                </div>
                            </div>

                            <Editor
                                height="100%"
                                className='rounded-lg overflow-clip'
                                defaultLanguage="javascript"
                                value={editorValue}
                                defaultValue='// Select a submission to view code history'
                                theme="vs-dark"
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: true },
                                    fontSize: 14,
                                    scrollBeyondLastLine: false,
                                    wordWrap: 'on',
                                }}
                            />
                        </BorderedContainer>

                        {/* Results container */}
                        <BorderedContainer customStyle="p-2 w-1/6 min-w-[15rem] h-[80vh] flex flex-col gap-2 content-stretch">
                            <h1>Results</h1>
                            
                        </BorderedContainer>
                    </div>
                </div>
            }
        </div>
    );
}
