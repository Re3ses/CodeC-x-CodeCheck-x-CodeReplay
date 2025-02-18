import React from "react";
import Editor from '@monaco-editor/react';
import BorderedContainer from "../wrappers/BorderedContainer";

interface ComparisonResult {
    confidence: number;
    file_name: string;
    is_plagiarized: boolean;
}

interface Submission {
    _id: string;
    language_used: string;
    code: string;
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

interface SourceCodeViewerProps {
    submissions: Submission[];
    ComparisonResult: ComparisonResult[];
}

const getLanguage = (language: string) => {
    return language.split(" ")[0].toLowerCase();
}

const SourceCodeViewer: React.FC<SourceCodeViewerProps> = ({ submissions, ComparisonResult }) => {
    if (submissions.length === 0) {
        return null;
    } else {
        return (
            <div className="grid grid-cols-2 gap-2 w-full">
                {submissions.map((submission, i) => (
                    <BorderedContainer key={i} customStyle="flex flex-col p-2">
                        <h2 className="font-medium">Source Code - {submission.learner}</h2>
                        <h3>{getLanguage(submission.language_used)}</h3>
                        <Editor
                            height="300px"
                            defaultLanguage={getLanguage(submission.language_used)}
                            value={submission.code}
                            theme="vs-dark"
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                automaticLayout: true,
                                scrollbar: {
                                    vertical: 'visible',
                                    horizontal: 'visible'
                                }
                            }}
                        />
                    </BorderedContainer>
                ))}
            </div>
        );
    }

};

export default SourceCodeViewer;