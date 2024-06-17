import { ProblemSchemaInferredType } from "@/lib/interface/problem";
import { RoomSchemaInferredType } from "@/lib/interface/room";
import { GetRoom } from "@/utilities/apiService";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import BorderedContainer from "./ui/wrappers/BorderedContainer";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { getUser } from "@/lib/auth";

export default function RoomProblemList({
    params,
}: {
    params: { slug: string };
}) {
    const roomQuery = useQuery<RoomSchemaInferredType>({
        queryKey: ["room"],
        queryFn: async () => {
            const res = await GetRoom(params.slug!);
            return res;
        },
    });

    const userQuery = useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            const res = await getUser();
            return res;
        },
    });

    return (
        <div className="h-fit lg:grid sm:w-full sm:flex sm:flex-col grid-cols-4 gap-2">
            {roomQuery.data?.problems.map((item: ProblemSchemaInferredType, index) => {
                return (
                    <BorderedContainer customStyle="h-fit" key={index}>
                        <p className="text-md bg-zinc-900 p-5">{item.name}</p>
                        <div className="p-5 w-full">
                            {userQuery.data?.type === "Mentor" ? (
                                <Link
                                    href={`/mentor/coderoom/r/${params.slug}/problem/${item.slug}`}
                                    className={buttonVariants({
                                        variant: "default",
                                    })}
                                >
                                    View problem
                                </Link>
                            ) : (
                                <Link
                                    href={`/learner/coderoom/r/${params.slug}/problem/${item.slug}`}
                                    className={buttonVariants({
                                        variant: "default",
                                    })}
                                >
                                    Solve problem
                                </Link>
                            )}
                        </div>
                    </BorderedContainer>
                );
            })}
        </div>
    );
}
