"use client"

import { Editor } from "@monaco-editor/react";
import { useState } from "react";


export default function Page() {
    const [code, setCode] = useState<string>();

    {/*Some live coding feature*/ }

    function handleChange() {
        // set code here per change
    }

    return (
        <div>
            <div className="w-full border-zinc-500 border-b-2 h-10">
                {/* Some learner live code settings here */}
            </div>
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
