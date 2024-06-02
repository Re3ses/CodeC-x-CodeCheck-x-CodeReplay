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
import { Button } from "@/components/ui/button";

// TODO: change to server url (in env)
const socket = io("http://localhost:8800/");

export default function Page() {
    const { isPending, isError, error, data } = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser(),
    });

    const [roomId, setRoomId] = useState<string>("test_room_id");
    const [code, setCode] = useState<any>();
    const [users, setUsers] = useState<any>();
    const [isHidden, setIsHidden] = useState<boolean>(false);
    const [isFrozen, setIsFrozen] = useState<boolean>(false);

    useEffect(() => {
        socket.emit("init-server", roomId);
        socket.on("joined-users", value => { console.log(value) });
    }, [])

    function handleChange(value: string | undefined, _event: any | null) {
        console.log(value);
        socket.emit("update-editor", value, "test_room_id");
    }

    function changeEditorVisibility() {
        socket.emit('hide-to-all', !isHidden, roomId);
        setIsHidden(!isHidden);
    }

    function changeFrozenStateOfAll() {
        socket.emit('freeze-all', !isFrozen, roomId);
        setIsFrozen(!isFrozen);
    }

    return (
        <div className="h-screen">
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
                        <Panel defaultSize={25} className="p-4 bg-red-200">
                            {/*button group*/}
                            <div className="flex gap-4">
                                <Button variant={"outline"} onClick={() => changeEditorVisibility()}>Hide editor</Button>
                                <Button variant={"outline"} onClick={() => changeFrozenStateOfAll()}>Freeze all</Button>
                            </div>
                        </Panel>
                    </PanelGroup>
                </Panel>
                <PanelResizeHandle className="w-1 bg-zinc-500" />
                <Panel>
                    <PanelGroup autoSaveId="example" direction="vertical">
                        <Panel defaultSize={25}>
                            <div>
                                <span>Editor status {isHidden ? "Hidden" : "Visible"}</span>
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
