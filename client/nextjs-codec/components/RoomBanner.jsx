import React from "react"

import BorderedContainer from "./ui/wrappers/BorderedContainer"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { GetRoom } from "@/utilities/apiService"
import { buttonVariants } from "./ui/button"

export default function RoomBanner({ room, username, usertype, params }) {
    const roomQuery = useQuery({
        queryKey: ["room"],
        queryFn: async () => {
            const res = await GetRoom(params.slug)
            return res
        }
    })
    return (
        <BorderedContainer>
            <div className="flex p-5 gap-2 bg-zinc-900 justify-between">
                <div className="my-auto flex gap-2">
                    <p className="my-auto">{username}</p>
                    <span className="bg-[gold] text-[black] text-sm px-4 h-fit my-auto w-fit rounded-lg">
                        {usertype}
                    </span>
                </div>
                <p className="text-2xl">{room?.name}</p>
            </div>
            <div className="flex flex-col text-center p-2">
                <p>{room?.description}</p>
                <p className="text-sm text-zinc-500">{room?.type}</p>
            </div>
            {usertype == "Mentor" && (
                <div className="flex justify-between p-5">
                    <p className="my-auto">{room?.slug}</p>
                    <Link
                        href={`/mentor/coderoom/problem-creation/${roomQuery.data?.slug}`}
                        className={buttonVariants({ variant: "default" })}
                    >
                        Create problem
                    </Link>
                </div>
            )}
        </BorderedContainer>
    )
}

