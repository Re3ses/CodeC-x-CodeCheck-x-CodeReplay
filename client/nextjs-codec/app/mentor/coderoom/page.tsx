"use client"

import { Button, buttonVariants } from "@/components/ui/button";
import CreateClassroomForm from "@/components/ui/classroom/createClassroomForm";
import BorderedContainer from "@/components/ui/wrappers/BorderedContainer";
import Modal from "@/components/ui/wrappers/Modal";
import { RoomSchemaInferredType } from "@/lib/interface/room";
import { GetMentorRooms } from "@/utilities/apiService";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function Page() {
    const searchParams = useSearchParams();
    const roomsQuery = useQuery({
        queryKey: ["rooms", 1],
        queryFn: async () => {
            const data = GetMentorRooms();
            if (!data) {
                throw new Error("failed to get room data");
            }
            return data;
        },
    });

    function makeid(length: number) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return result;
    }

    return (
        <div className="flex flex-col">
            <div className="bg-zinc-900 p-5 flex justify-between">
                <p className="text-lg my-auto">Created rooms</p>
                <Modal
                    label="Host live session"
                    title="Host session"
                    description="Host live session for demoing a problem created in a room. Learners and Mentors can code along as well as perform collaborative code writing"
                >
                    <Link href={{
                        pathname: '/mentor/live-code',
                        query: { room_id: makeid(5) },
                    }}>Host live session</Link>
                </Modal>
                <Modal
                    label="Create classroom"
                    title="Create rooms"
                    description="Create a room where you can host your lectures, courses, or programming problems"
                >
                    <CreateClassroomForm />
                </Modal>
            </div>
            <div className="grid grid-cols-4 gap-2 p-5">
                {roomsQuery.data?.map((item: RoomSchemaInferredType) => {
                    return (
                        <BorderedContainer key={item._id}>
                            <div className="flex justify-between p-5 bg-zinc-900 gap-2 m-auto">
                                <p className="text-lg my-auto">
                                    {item.name}
                                </p>
                                <Link
                                    href={`/mentor/coderoom/r/${item.slug}?${searchParams}`}
                                    className={`${buttonVariants({ variant: "default" })} w-fit`}
                                >
                                    Enter room
                                </Link>
                            </div>
                            <div className="p-5 flex flex-col gap-2 max-h-[7rem] overflow-y-scroll">
                                <p className="text-sm text-zinc-300">
                                    {item.description}
                                </p>
                            </div>
                        </BorderedContainer>
                    );
                })}
            </div>
        </div>
    );
}
