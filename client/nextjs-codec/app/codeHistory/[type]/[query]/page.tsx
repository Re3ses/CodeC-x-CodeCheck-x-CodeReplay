'use client';
import { use, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Nav from '@/app/dashboard/nav';
import BorderedContainer from '@/components/ui/wrappers/BorderedContainer';
import { Editor } from '@monaco-editor/react';

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

    const { type, query } = useParams();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [user, setUser] = useState<User>();
    const [editorValue, setEditorValue] = useState('');
    const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
    const [results, setResults] = useState<any>();
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
            if (type === "problem") {
                await fetch(`/api/userSubmissions?problem_slug=${query}&all=true&single=true`).then(
                    async (val) => {
                        await val.json().then((data) => {
                            setSubmissions(data.submission);
                        });
                    }
                );
            } else if (type === "coderoom") {
                await fetch(`/api/userSubmissions?room_id=${query}&all=true&single=true`).then(
                    async (val) => {
                        await val.json().then((data) => {
                            setSubmissions(data.submission);
                        });
                    }
                );
            }
        };
        console.log("submissions:", submissions);
        fetchData();
    }, [type, query, router]);

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
        <div className="h-screen w-screen flex flex-col bg-[#111827]">
            {/* Nav section */}
            <Nav type={user?.type} name={user?.auth.username} />

            <div className="flex-grow flex justify-center w-5/6 items-center self-center">
                {/* Submissions container */}
                <BorderedContainer customStyle="p-2 w-1/6 min-w-[15rem] h-5/6 max-h-[80vh] max-w-screen flex flex-col gap-2 content-stretch bg-[#808782]">
                    <h1 className="font-bold">Submissions</h1>
                    <ol className="flex-grow flex flex-col gap-2 justify-start p-2 border rounded-sm border-gray-950 overflow-y-scroll">
                        {submissions.map((submission, i) => (
                            <li key={i}
                                className="font-medium hover:bg-gray-700 p-1 rounded-sm pointer-events-auto"
                                onClick={() => {
                                    setCurrentSubmissionIndex(i);
                                    handleSubmissionClick(submission);
                                }}>
                                <h2 className='pointer-events-none'>
                                    {submission.learner}
                                </h2>
                            </li>
                        ))}
                    </ol>
                </BorderedContainer>

                {/* Editor container */}
                <BorderedContainer customStyle="p-4 h-5/6 flex-grow flex-col gap-2 overflow-hidden bg-[#808782]">
                    <div>
                        <div>Current: {currentHistoryIndex}</div>
                        <button className="p-2 hover:bg-gray-700 rounded-sm" onClick={handleBackClick}>
                            {"Back"}
                        </button>
                        <button className="p-2 hover:bg-gray-700 rounded-sm" onClick={handleForwardClick}>
                            {"Next"}
                        </button>
                    </div>

                    <Editor
                        height="90%"
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
            </div>
        </div>
    );
}
