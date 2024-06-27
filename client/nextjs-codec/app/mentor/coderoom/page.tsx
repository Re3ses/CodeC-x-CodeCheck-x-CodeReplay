"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    let result = "";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  return (
    <BorderedContainer customStyle="flex flex-col m-4 text-card-foreground min-w-[580px]">
      <div className="p-4 flex flex-col gap-2 justify-between items-center sm:flex-row">
        <div className="flex flex-col justify-center gap-1 items-center sm:items-start">
          <h2 className="text-2xl font-bold">Created rooms</h2>
          <p className="text-muted-foreground">List of created classrooms</p>
        </div>
        <div className="space-x-2">
          <Modal
            label="Host live session"
            title="Host session"
            description="Host live session for demoing a problem created in a room. Learners and Mentors can code along as well as perform collaborative code writing"
          >
            <Link
              href={{
                pathname: "/mentor/live-code",
                query: { room_id: makeid(5) },
              }}
              className={buttonVariants({ variant: "default" })}
            >
              Host live session
            </Link>
          </Modal>
          <Modal
            label="Create classroom"
            title="Create rooms"
            description="Create a room where you can host your lectures, courses, or programming problems"
          >
            <CreateClassroomForm />
          </Modal>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-5 sm:grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {roomsQuery.data?.map((item: RoomSchemaInferredType) => {
          return (
            <BorderedContainer
              key={item.id}
              customStyle="bg-card text-card-foreground flex flex-col gap-4 justify-center items-center p-4"
            >
              <div className="flex flex-col">
                <span className="text-lg font-bold my-auto text-center">
                  {item.name}
                </span>
                <span className="text-sm text-muted-foreground text-center">
                  {item.description}
                </span>
              </div>
              <Link
                href={`/mentor/coderoom/r/${item.slug}?${searchParams}`}
                className={`${buttonVariants({ variant: "default" })} w-full`}
              >
                Enter
              </Link>
            </BorderedContainer>
          );
        })}
      </div>
    </BorderedContainer>
  );
}
