"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
    getLanguages,
    getSubmission,
    postSubmission,
} from "@/utilities/rapidApi";
import { Editor } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function Page() {
    const [selectedLang, setSelectedLang] = useState<string>();
    const [languages, SetLanguages] = useState<any>();
    const [editorValue, setEditorValue] = useState<any>();
    const [stdin, setStdin] = useState<any>();
    const [submissionResult, setSubmissionResult] = useState<any>();

    useEffect(() => {
        const res: () => Promise<any> = async () => {
            return await getLanguages();
        };
        res().then((result) => SetLanguages(result));
    }, []);

    async function handleSubmit() {
        const data = {
            source_code: btoa(editorValue),
            language_id: selectedLang,
            stdin: btoa(stdin) || null,
        };

        toast({ title: "Testing code..." });

        const submissionToken = await postSubmission(data);

        setTimeout(async () => {
            const submission = await getSubmission(submissionToken.token);
            setSubmissionResult(submission);
            toast({ title: "Code testing complete!" });
        }, 3000);
    }

    return (
        <PanelGroup direction="vertical" className="p-2 flex flex-col h-screen">
            <Panel className="flex-1 border-b-2 border-zinc-700 min-h-[10em]">
                <div className="flex justify-between bg-zinc-900 p-3">
                    <div className="my-auto">
                        <select
                            className="p-2 rounded-md"
                            name="languages"
                            form="submit-form"
                            onChange={(e) => {
                                setSelectedLang(e.currentTarget.value);
                            }}
                            required
                        >
                            <option value="">None</option>
                            {languages?.map((val: any) => {
                                return (
                                    <option value={val.id}>{val.name}</option>
                                );
                            })}
                        </select>
                    </div>
                    <Button
                        variant="default"
                        onClick={() => handleSubmit()}
                    >
                        Run
                    </Button>
                </div>
                <div className="h-full">
                    <Editor
                        theme="vs-dark"
                        defaultLanguage="plaintext"
                        value={editorValue}
                        onChange={(val) => {
                            setEditorValue(val);
                        }}
                    />
                </div>
            </Panel>
            <PanelResizeHandle />
            <Panel>
                <PanelGroup direction="horizontal" className="flex flex-1">
                    <Panel className="flex flex-col w-[25%] min-w-[20em] border-r-2 border-zinc-700">
                        <p className="bg-zinc-900 p-3">Use custom input</p>
                        <textarea
                            className="w-full h-full p-3"
                            name="input"
                            id="input"
                            placeholder="custom input here"
                            onChange={(e) => {
                                setStdin(e.currentTarget.value);
                            }}
                        ></textarea>
                    </Panel>
                    <PanelResizeHandle />
                    <Panel className="flex-1 flex flex-col min-w-[20em]">
                        <div className="flex gap-2 p-3 bg-zinc-900">
                            <p>
                                {submissionResult?.language.name}
                            </p>
                            <p>
                                {submissionResult?.status.description}
                            </p>
                        </div>
                        <div className="p-2 rounded-md overflow-scroll whitespace-pre-wrap">
                            {submissionResult?.stdout != null
                                ? atob(submissionResult?.stdout)
                                : ""}
                        </div>
                    </Panel>
                </PanelGroup>
            </Panel>
        </PanelGroup>
    );
}
