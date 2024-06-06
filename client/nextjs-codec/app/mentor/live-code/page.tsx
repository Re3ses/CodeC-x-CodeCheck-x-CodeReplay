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
import { ChangeEvent, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChangeHandler } from "react-hook-form";

interface s_User {
    username: String,
    socket_id: String,
}

// TODO: change to server url (in env)
const socket = io("http://localhost:8800/");

export default function Page() {
    const { isPending, isError, error, data } = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser(),
    });

    const [roomId, setRoomId] = useState<string>("test_room_id");
    const [code, setCode] = useState<any>();
    const [users, setUsers] = useState<s_User[]>([]);
    const [isHidden, setIsHidden] = useState<boolean>(false);
    const [isFrozen, setIsFrozen] = useState<boolean>(false);

    useEffect(() => {
        socket.emit("init-server", roomId);
        socket.on("users-list", value => { setUsers(value) });

        return () => {
            socket.off("init-server");
        }
    }, [users])

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
    function updateMeetLink(event: ChangeEvent<HTMLInputElement>) {
        socket.emit('update-meet-link', roomId, event.currentTarget.value);
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
                            <div className="flex flex-col gap-5">
                                <Input onChange={updateMeetLink} />
                                <span>Editor status {isHidden ? "Hidden" : "Visible"}</span>
                                <span>Connected learners</span>
                                {users.map(value => {
                                    return (
                                        <>
                                            <span>Username: {value.username}</span>
                                            <span>Socket ID: {value.socket_id}</span>
                                        </>
                                    )
                                })}
                            </div>
                        </Panel>
                        <PanelResizeHandle className="h-1 bg-zinc-500" />
                        <Panel>
                            <div>
                                Mentor ID: {socket.id}
                            </div>
                        </Panel>
                    </PanelGroup>
                </Panel>
            </PanelGroup>;
        </div>
    );
}
