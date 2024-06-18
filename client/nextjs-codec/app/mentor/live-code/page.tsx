// [ TODO ]
// socket events for Mentor and X number students
// language selector (global and local)
// code compilation (global and local)
// problem description
// chat box

"use client";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { getUser } from "@/lib/auth";
import { Editor } from "@monaco-editor/react";
import { useQuery } from "@tanstack/react-query";
import { ChangeEvent, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChangeHandler } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import Image from 'next/image';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProblemSchemaInferredType } from '@/lib/interface/problem';
import { GetProblemsMentor } from '@/utilities/apiService';

interface s_User {
    username: String,
    socket_id: String,
}

// TODO:
// change to server url (in env) [/]
// generate room ID that is associated with roomname e.g., roomname-ACeg13 [/]
// student search functionality [/]
// handle problem selection [] 
// handle private messages []
// handle kick a/all learner []
// kick all learners if mentor leaves []
const socket = io(`${process.env.NEXT_PUBLIC_SERVER_URL}${process.env.NEXT_PUBLIC_SOCKET_PORT}`);

export default function Page() {
    const searchParams = useSearchParams()

    const { data } = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser(),
    });

    const [roomId, setRoomId] = useState<string>("");
    const [users, setUsers] = useState<s_User[]>([]);
    const [isHidden, setIsHidden] = useState<boolean>(false);
    const [isFrozen, setIsFrozen] = useState<boolean>(false);
    const [problems, setProblems] = useState<ProblemSchemaInferredType[] | any>([]);
    const [selectedProblem, setSelectedProblem] = useState<ProblemSchemaInferredType>();

    socket.emit("init-server", roomId);

    useEffect(() => {
      function userListEvent(value: s_User[]) {
        console.log(value);
        setUsers(value);
      }

      const fetchProblems = async () => {
        try {
            const res = await GetProblemsMentor();
            setProblems(res);
        } catch (e) {
            console.warn(`no problems found: ${e}`)
        }
      }
      fetchProblems();

      socket.on("users-list", userListEvent);

      setRoomId(searchParams.get("room_id")!);

      return () => {
        socket.off("users-list", userListEvent);
      };
    }, [searchParams]);

    function handleChange(value: string | undefined, _event: any | null) {
        console.log(value);
        socket.emit("update-editor", value, roomId);
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
    function test() {
        console.log(problems)
    }
    function handleProblemSelect(value: string) {
        console.log("Problem select changed: ", value)
        const foundObject = problems.find((obj: ProblemSchemaInferredType) => obj.slug === value);
        console.log(foundObject);
        setSelectedProblem(foundObject);
    }


    return (
      <div className="h-screen">
        <PanelGroup autoSaveId="example" direction="horizontal">
          <Panel defaultSize={50}>
            <PanelGroup autoSaveId="example" direction="vertical">
              <Panel defaultSize={60}>
                <button onClick={() => test()}>test</button>
                <Editor
                  theme="vs-dark"
                  defaultValue="content here"
                  onChange={(value, event) => handleChange(value, event)}
                />
              </Panel>
              <PanelResizeHandle className="h-1 bg-zinc-500" />
              <Panel
                defaultSize={25}
                className="p-4 space-y-5 flex flex-col h-full"
              >
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <h6 className="text-sm">Google meet link</h6>
                    <Input
                      className="w-[235px] p-4 bg-zinc-900 text-sm"
                      placeholder="Google meet link"
                      onChange={updateMeetLink}
                    />
                  </div>
                  <div className="space-y-2">
                    <h6 className="text-sm">Room code</h6>
                    <div className="w-[160px] px-4 py-2 bg-zinc-900 text-sm font-bold text-white/50 rounded-lg">
                      {roomId}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h6 className="text-sm">Current editor status</h6>
                    <div className="w-[160px] px-4 py-2 bg-zinc-900 text-sm font-bold text-white/50 rounded-lg">
                      <span>{isHidden ? "Hidden" : "Visible"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h6 className="text-sm">Students editor status</h6>
                    <div className="w-[160px] px-4 py-2 bg-zinc-900 text-sm font-bold text-white/50 rounded-lg">
                      <span>{isFrozen ? "Frozen" : "Un-frozen"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 border border-white/25 rounded-lg flex flex-col overflow-hidden">
                  <div className="flex justify-between border-b border-white/25 p-4">
                    <h6 className="text-sm text-white/50 self-center">
                      Mentor options
                    </h6>
                    <div className="flex gap-4">
                      <Select onValueChange={handleProblemSelect}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select problem" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {
                                problems.map((value: ProblemSchemaInferredType) => {
                                    return (<>
                                        <SelectItem value={value.slug}>{value.name}</SelectItem> 
                                    </>);

                                })
                            }
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Button
                        className="rounded-none"
                        variant={"outline"}
                        onClick={() => changeEditorVisibility()}
                      >
                        Hide editor
                      </Button>
                      <Button
                        className="rounded-none"
                        variant={"outline"}
                        onClick={() => changeFrozenStateOfAll()}
                      >
                        Freeze all
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 p-4 overflow-auto">
                    <div className="border border-white/25 rounded-lg h-full flex flex-col">
                      <div className="flex justify-between border-b border-white/25 p-2">
                        <h5 className="text-xs text-white/50">
                          Problem description
                        </h5>
                      </div>
                      <div className="p-3 flex-1 overflow-auto">
                        {/* template */}
                        <div className="min-h-screen bg-red-300">h</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle className="w-1 bg-zinc-500" />
          <Panel>
            <PanelGroup autoSaveId="example" direction="vertical">
              <Panel defaultSize={25} className="p-4">
                <div className="border border-white/25 rounded-lg">
                  <div className="border-b border-white/25 p-4 flex justify-between">
                    <h6 className="text-sm text-white/50 self-center">
                      Connected learners
                    </h6>
                    <div className="flex gap-2">
                      <FontAwesomeIcon
                        className="self-center"
                        icon={faMagnifyingGlass}
                      />
                      <input
                        className="p-2 bg-transparent border-b border-white/25 text-sm"
                        placeholder="student name"
                      />
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-2">
                    {users.map((value, index) => {
                      return (
                        <div className="flex gap-4" key={index}>
                          <Image
                            className="rounded-full"
                            src="https://randomuser.me/api/portraits/men/30.jpg"
                            alt="profile image"
                            width={32}
                            height={32}
                          />
                          <div className="self-center flex flex-col">
                            <span className="text-sm font-bold">
                              {value.username}
                            </span>
                            <span className="text-sm text-white/50">
                              {value.socket_id}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="h-1 bg-zinc-500" />
              <Panel className="p-4">
                <div className="border border-white/25 rounded-lg h-full flex flex-col">
                  <div className="border-b border-white/25 p-4 flex justify-between">
                    <h6 className="text-sm text-white/50 self-center">
                      Now viewing
                    </h6>
                  </div>
                  <div className="flex-1 p-2 overflow-hidden">
                    <Editor
                      theme="vs-dark"
                      options={{ readOnly: true }}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    );
}
