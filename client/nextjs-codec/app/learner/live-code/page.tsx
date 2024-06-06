"use client"

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:8800/");

export default function Page() {
    const [mentorEditorValue, setMentorEditorValue] = useState<any>();
    const [isMentorEditorHidden, setIsMentorEditorHidden] = useState<boolean>(false);
    const [isFrozen, setIsFrozen] = useState<boolean>(false);
    const [isRoomJoined, setIsRoomJoined] = useState<any>(false);
    const [updatedMeetLink, setUpdatedMeetLink] = useState<string>("");

    useEffect(() => {
        function updatedEditorEvent(editor_value: any) {
            setMentorEditorValue(editor_value);
            console.log(editor_value);
        }
        function roomJoinedEvent(value: any) {
            setIsRoomJoined(value);
        }
        function freezeEvent(value: boolean) {
            setIsFrozen(value);
        }
        function mentorEditorHiddenEvent(value: boolean) {
            setIsMentorEditorHidden(value);
        }
        function updatedMeetLinkEvent(value: string) {
            setUpdatedMeetLink(value);
        }

        // TODO: Change socket.id to username
        socket.emit("join-room", socket.id, "test_room_id");
        socket.on("join-success", roomJoinedEvent);
        socket.on("updated-editor", updatedEditorEvent);
        socket.on("freeze", freezeEvent);
        socket.on("hide-editor", mentorEditorHiddenEvent);
        socket.on("updated-meet-link", updatedMeetLinkEvent);

        return () => {
            socket.off("updated-editor", updatedEditorEvent);
            socket.off("freeze", freezeEvent);
            socket.off("hide-editor", mentorEditorHiddenEvent);
        }
    }, [mentorEditorValue])


    return (
        <div className="p-5 space-y-5">
            <div className="bg-zinc-900 p-5 rounded-lg">
                {mentorEditorValue}
            </div>
            <div className="bg-zinc-900 p-5 rounded-lg">
                {updatedMeetLink}
            </div>
            <div className="flex flex-col gap-5">

                {isRoomJoined ? <span>Room successfully joined</span> : <span>No joined rooms yet</span>}
                {isFrozen ? <span>Frozen by mentor</span> : <span>Not frozen</span>}
                {isMentorEditorHidden ? <span>Mentor Editor is hidden from view</span> : <span>Mentor editor is visible</span>}
            </div>
        </div>
    )
}
