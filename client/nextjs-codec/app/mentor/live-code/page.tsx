// [ TODO ]
// socket events for Mentor and X number students
// language selector (global and local)
// code compilation (global and local)
// problem description
// chat box

"use client";

import AdminSettingsDrawer from "@/components/AdminSettingsDrawer";
import { getUser } from "@/lib/auth";
import { Editor } from "@monaco-editor/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Input } from "@/components/ui/input";

// TODO: change to server url (in env)
// const socket = io("http://localhost:8800/");

export default function Page() {
    const { isPending, isError, error } = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser(),
    });
    const [code, setCode] = useState<any>();

    function handleChange(value: string | undefined, _event: any | null) {
        console.log(value);
    }

    return (
        <div className="h-screen">
            <div className="p-4">
                options
            </div>
            <PanelGroup autoSaveId="example" direction="horizontal">
                <Panel defaultSize={50}>
                    <PanelGroup autoSaveId="example" direction="vertical">
                        <Panel defaultSize={60}>
                            <Editor
                                theme="vs-dark"
                                defaultValue="content here"
                                value={code}
                                onChange={(value, event) => handleChange(value, event)}
                            />
                        </Panel>
                        <PanelResizeHandle className="h-1 bg-zinc-500" />
                        <Panel defaultSize={25}>
                            <div>
                                panel 0
                                edit problem here
                            </div>
                        </Panel>
                    </PanelGroup>
                </Panel>
                <PanelResizeHandle className="w-1 bg-zinc-500" />
                <Panel>
                    <PanelGroup autoSaveId="example" direction="vertical">
                        <Panel defaultSize={25}>
                            <div>
                                panel 1
                            </div>
                        </Panel>
                        <PanelResizeHandle className="h-1 bg-zinc-500" />
                        <Panel>
                            <div>
                                panel 2
                            </div>
                        </Panel>
                    </PanelGroup>
                </Panel>
            </PanelGroup>;
        </div>
    );
}
