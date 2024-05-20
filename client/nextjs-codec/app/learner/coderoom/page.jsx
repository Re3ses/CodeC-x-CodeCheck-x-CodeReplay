"use client"
import JoinRoomForm from "@/components/JoinRoomForm"
import { buttonVariants } from "@/components/ui/button"
import BorderedContainer from "@/components/ui/wrappers/BorderedContainer"
import { GetLearnerRooms } from "@/utilities/apiService"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

export default function Joined() {
    const roomsQuery = useQuery({
        queryKey: ["rooms", 1],
        queryFn: async () => await GetLearnerRooms()
    })

    return (
        <div className="flex h-full flex-col gap-2">
            <div className="flex justify-between p-5 bg-zinc-900">
                <p className="text-xl my-auto">Joined rooms</p>
                <JoinRoomForm />
            </div>
            <div className="grid grid-cols-4 gap-2 p-5">
                {roomsQuery.data?.map(item => {
                    return (
                        <BorderedContainer>
                            <div className="flex flex-wrap justify-between p-5 bg-zinc-900 gap-2 m-auto">
                                <p className="text-lg my-auto">{item.name}</p>
                                <Link
                                    href={`/learner/coderoom/r/${item.slug}`}
                                    className={`${buttonVariants({ variant: "default" })} w-fit`}
                                >
                                    Enter room
                                </Link>
                            </div>
                            <div className="p-5 flex flex-col gap-2 max-h-[10rem] overflow-scroll">
                                <p className="text-sm text-zinc-300">{item.description}</p>
                            </div>
                        </BorderedContainer>
                    )
                })}
            </div>
        </div>
    )
}

