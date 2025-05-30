'use client';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { ChangeEvent, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Editor } from '@monaco-editor/react';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tooltip } from '@radix-ui/react-tooltip';
import SafeHtml from '@/components/SafeHtml';
import { useSocket } from '@/context/socket';

export default function Page() {
  const { socket } = useSocket();

  const [mentorEditorValue, setMentorEditorValue] = useState<any>();
  const [editorValue, setEditorValue] = useState<any>();
  const [isMentorEditorHidden, setIsMentorEditorHidden] =
    useState<boolean>(false);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [isRoomJoined, setIsRoomJoined] = useState<any>(false);
  const [updatedMeetLink, setUpdatedMeetLink] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [mentorId, setMentorId] = useState<string>('');
  const [mentorCreds, setMentorCreds] = useState<any>('');
  const [problem, setProblem] = useState<any>();

  useEffect(() => {
    if (socket) {
      const updatedEditorEvent = (editor_value: any) => {
        setMentorEditorValue(editor_value);
        console.log(editor_value);
      };
      const roomJoinedEvent = (value: any) => {
        setIsRoomJoined(value);
      };
      const freezeEvent = (value: boolean) => {
        setIsFrozen(value);
      };
      const mentorEditorHiddenEvent = (value: boolean) => {
        setIsMentorEditorHidden(value);
      };
      const updatedMeetLinkEvent = (value: string) => {
        setUpdatedMeetLink(value);
      };
      const mentorIdEvent = (value: string) => {
        setMentorId(value);
      };
      const selectedProblemEvent = (value: string) => {
        setProblem(value);
        console.log(value);
      };
      const mentorCredsEvent = (value: any) => {
        setMentorCreds(value);
        console.log('Mentor creds: ', value);
      };

      // TODO: Change socket.id to username []
      // recv mentor id for one-on-one communication []
      // send profile to socket []
      socket.on('join-success', roomJoinedEvent);
      socket.on('updated-editor', updatedEditorEvent);
      socket.on('freeze', freezeEvent);
      socket.on('hide-editor', mentorEditorHiddenEvent);
      socket.on('updated-meet-link', updatedMeetLinkEvent);
      socket.on('mentor-id', mentorIdEvent);
      socket.on('selected-problem', selectedProblemEvent);
      socket.on('mentor-creds', mentorCredsEvent);

      return () => {
        socket.off('updated-editor', updatedEditorEvent);
        socket.off('freeze', freezeEvent);
        socket.off('hide-editor', mentorEditorHiddenEvent);
        socket.off('join-success', roomJoinedEvent);
        socket.off('updated-meet-iink', updatedMeetLinkEvent);
        socket.off('selected-problem', selectedProblemEvent);
      };
    }
  }, [socket]);

  if (socket) {
    const handleJoinSessionInputChange = (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      setRoomId(event.currentTarget.value);
    };
    const joinLiveSession = () => {
      socket.emit('join-room', socket.id, roomId);
    };
    const updateLearnerEditorValue = (value: string | undefined) => {
      socket.emit('update-learner-editor', value, mentorId); // TODO
    };

    return (
      <div className="p-5 space-y-5 h-screen flex flex-col">
        <div className="grid grid-cols-5 flex-none gap-4">
          <div className="flex flex-col justify-center items-center gap-1">
            {isRoomJoined ? (
              <>
                <div className="flex flex-col gap-3 justify-center">
                  <div className="self-center">
                    <Image
                      className="rounded-full"
                      src="https://randomuser.me/api/portraits/men/30.jpg"
                      alt="profile image"
                      width={42}
                      height={42}
                    />
                  </div>
                  <span className="text-sm text-white/50 text-center">
                    Hosted by: {mentorCreds.first_name} {mentorCreds.last_name}
                  </span>
                </div>
              </>
            ) : (
              <span>No joined rooms yet</span>
            )}
          </div>
          <div className="flex flex-col justify-center items-center gap-1">
            <span className="text-sm text-white/50 text-center">
              Google meet link
            </span>
            <div className="bg-zinc-900 h-[42px] w-[13rem] overflow-auto flex items-center justify-center">
              <span className="text-sm font-bold text-white/50">
                {updatedMeetLink}
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-1">
            <span className="text-sm text-white/50 text-center">
              Room invite code
            </span>
            <div className="bg-zinc-900 h-[36px] w-[10rem] flex items-center justify-between">
              <Input
                type="text"
                className="text-sm pl-2 font-bold text-white/50 rounded-none h-fit border-none bg-zinc-900 focus-visible:ring-inset focus-visible:ring-1"
                onChange={handleJoinSessionInputChange}
                placeholder="room_id"
              />
              <Button
                onClick={joinLiveSession}
                className="bg-zinc-700 h-full p-auto rounded-none"
              >
                <Image
                  className="self-center"
                  src="/images/enter.svg"
                  width={30}
                  height={30}
                  alt="join room logo"
                />
              </Button>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-1">
            <span className="text-sm text-white/50 text-center">
              Current editor status
            </span>
            <div className="bg-zinc-900 h-[36px] w-[10rem] flex items-center justify-center">
              {isFrozen ? (
                <span className="text-sm font-bold text-white/50">Frozen</span>
              ) : (
                <span className="text-sm font-bold text-white/50">
                  Not frozen
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-1">
            <span className="text-sm text-white/50 text-center">
              Mentor editor status
            </span>
            <div className="bg-zinc-900 h-[36px] w-[10rem] flex items-center justify-center">
              {isMentorEditorHidden ? (
                <span className="text-sm font-bold text-white/50">Hidden</span>
              ) : (
                <span className="text-sm font-bold text-white/50">Visible</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <PanelGroup
            autoSaveId="learnerpanel"
            direction="horizontal"
            className="h-full"
          >
            <Panel defaultSize={50}>
              <PanelGroup
                autoSaveId="learnerinnerpanel"
                direction="vertical"
                className="h-full"
              >
                <Panel className="p-4">
                  <div className="border border-white/25 rounded-lg h-full flex flex-col">
                    <div className="border-b border-white/25 p-4 flex justify-between">
                      <h6 className="text-sm text-white/50 self-center">
                        Now viewing: {mentorCreds.username}
                      </h6>
                    </div>
                    <div className="flex-1 p-2 overflow-auto">
                      <Editor
                        theme="vs-dark"
                        value={mentorEditorValue}
                        options={{ readOnly: true }}
                        className="h-full w-full"
                      />
                    </div>
                  </div>
                </Panel>
                <PanelResizeHandle className="h-1 bg-zinc-500" />
                <Panel defaultSize={50}>
                  <Editor
                    theme="vs-dark"
                    defaultValue="your code here"
                    className="h-full w-full"
                    onChange={(value: string | undefined) => {
                      updateLearnerEditorValue(value);
                    }}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="w-1 bg-zinc-500" />
            <Panel>
              <PanelGroup direction="vertical">
                <Panel defaultSize={50} className="p-4">
                  <div className="border border-white/25 rounded-lg h-full flex flex-col">
                    <div className="border-b border-white/25 p-4 flex justify-between">
                      <h6 className="text-sm text-white/50 self-center">
                        Problem description
                      </h6>
                    </div>
                    <div className="flex-1 p-2 overflow-auto">
                      <div className="p-3 flex-1 overflow-auto">
                        <div
                          className="text-sm 
                          [&_li]:list-decimal
                          [&_li]:ml-8
                          [&_li]:py-2
                          [&_code]:bg-[#1E1E1E]
                          [&_code]:p-1
                          [&_h4]:font-bold"
                        >
                          <SafeHtml
                            className="text-center font-bold pb-2"
                            html={problem?.name!}
                          />
                          <SafeHtml
                            className="pb-2"
                            html={problem?.description!}
                          />
                          <SafeHtml
                            className="pb-2"
                            html={problem?.constraints!}
                          />
                          <SafeHtml
                            className="pb-2"
                            html={problem?.input_format!}
                          />
                          <SafeHtml
                            className="pb-2"
                            html={problem?.output_format!}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>
                <PanelResizeHandle className="h-1 bg-zinc-500" />
                <Panel defaultSize={50} className="p-4">
                  <div className="border border-white/25 rounded-lg h-full flex flex-col">
                    <div className="border-b border-white/25 p-4 flex justify-between">
                      <h6 className="text-sm text-white/50 self-center">
                        Compiled results
                      </h6>
                      <div className="flex gap-2">
                        <Button className="rounded-none">Run code</Button>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button className="rounded-none">
                                Compare output
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Run code and compare output to problem testcase
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <div className="flex-1 p-2 overflow-auto">
                      compiled results here
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    );
  } else {
    return (
      <div className="h-100 text-center flex align-middle justify-center">
        Error connecting with/to socket...
      </div>
    );
  }
}
