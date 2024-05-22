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

const socket = io("http://localhost:4000/");

export default function Page() {
    const { isPending, isError, error } = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser(),
    });
    const [code, setCode] = useState<string>();

    const liveCodeQuery = useQuery({
        queryKey: ["liveCodeRequests"],
        queryFn: async () => {
            const response = await fetch("/api/liveCode/");

            if (!response.ok) {
                throw new Error("Failed to fetch liveCode request data");
            }

            return await response.json();
        }
    });

    useEffect(() => {
        socket.on("response", (data: string) => {
            setCode(data);
        });

        return () => {
            socket.off("response");
        };
    }, []);

    function handleChange(value: any) {
        socket.emit("code-content", value);
    }

    if (isError) {
        return <div>Error {error.message}</div>;
    }

    if (isPending) {
        return <div>Waiting for important bits...</div>;
    }

    return (
        <div className="h-screen">
            <PanelGroup autoSaveId="livecodepanels" direction="horizontal">
                <Panel defaultSize={40} minSize={20} className="border-zinc-700 border-r-4">
                    <div className="bg-zinc-900 p-5 flex flex-col gap-4 justify-center">
                        <AdminSettingsDrawer />
                        <div className="flex flex-col gap-3">
                            {liveCodeQuery.data?.liveCode_requests.map((request: any) => (
                                <div className="p-3 bg-zinc-700 rounded-lg" key={request._id}>
                                    <p>Request Reason: {request.request_reason}</p>
                                    <p>Room Slug: {request.room_slug}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Panel>
                <PanelResizeHandle />
                <Panel className="">
                    <PanelGroup direction="vertical">
                        <Panel minSize={20} className="border-zinc-700 border-b-4">
                            <Editor
                                theme="vs-dark"
                                height="90vh"
                                defaultValue="content here"
                                value={code}
                                onChange={handleChange}
                            />
                        </Panel>
                        <PanelResizeHandle />
                        <Panel minSize={20} className="">
                            <div className="flex">
                                <div className="flex gap-2 border-r-4 border-zinc-800 my-auto px-4">
                                    <p className="border whitespace-nowrap h-fit rounded-lg px-4 py-2 hover:bg-rose-900">Search</p>
                                    <p className="border whitespace-nowrap h-fit rounded-lg px-4 py-2 hover:bg-rose-900">Blind</p>
                                    <p className="border whitespace-nowrap h-fit rounded-lg px-4 py-2 hover:bg-rose-900">Freeze</p>
                                </div>
                                <div className="p-3 flex gap-2 overflow-scroll">
                                    <p className="border whitespace-nowrap h-fit rounded-lg px-4 py-2 hover:bg-rose-900">Student E. Button</p>
                                    <p className="border whitespace-nowrap h-fit rounded-lg px-4 py-2 hover:bg-rose-900">Student E. Button</p>
                                    <p className="border whitespace-nowrap h-fit rounded-lg px-4 py-2 hover:bg-rose-900">Student E. Button</p>
                                    <p className="border whitespace-nowrap h-fit rounded-lg px-4 py-2 hover:bg-rose-900">Student E. Button</p>
                                    <p className="border whitespace-nowrap h-fit rounded-lg px-4 py-2 hover:bg-rose-900">Student E. Button</p>
                                    <p className="border whitespace-nowrap h-fit rounded-lg px-4 py-2 hover:bg-rose-900">Student E. Button</p>
                                    <p className="border whitespace-nowrap h-fit rounded-lg px-4 py-2 hover:bg-rose-900">Student E. Button</p>
                                    <p className="border whitespace-nowrap h-fit rounded-lg px-4 py-2 hover:bg-rose-900">Student E. Button</p>
                                    <p className="border whitespace-nowrap h-fit rounded-lg px-4 py-2 hover:bg-rose-900">Student E. Button</p>
                                    <p className="border whitespace-nowrap h-fit rounded-lg px-4 py-2 hover:bg-rose-900">Student E. Button</p>
                                    <p className="border whitespace-nowrap h-fit rounded-lg px-4 py-2 hover:bg-rose-900">Student E. Button</p>
                                </div>
                            </div>
                            <Editor
                                theme="vs-dark"
                                height="90vh"
                                defaultValue="content here"
                                value={code}
                                onChange={handleChange}
                            />
                        </Panel>
                    </PanelGroup>
                </Panel>
            </PanelGroup>

        </div>
    );
}
