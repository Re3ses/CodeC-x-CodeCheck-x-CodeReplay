import React from "react"

import BorderedContainer from "./ui/wrappers/BorderedContainer"
import { useQuery } from "@tanstack/react-query"
import { GetRoom } from "@/utilities/apiService"

export default function RoomEnroleeList({ params }) {
    const roomQuery = useQuery({
        queryKey: ["room"],
        queryFn: async () => {
            const res = await GetRoom(params.slug)
            return res
        }
    })

    return (
        <BorderedContainer customStyle="max-w-sm w-[15em]">
            <p className="text-lg text-zinc-200 bg-zinc-900 p-5">Student list</p>
            <div className="p-5">
                {roomQuery.data?.enrollees.map(enrollees => {
                    return (
                        <p className="truncate">
                            {enrollees.learner.first_name} {enrollees.learner.last_name}
                        </p>
                    )
                })}
            </div>
        </BorderedContainer>
    )
}

