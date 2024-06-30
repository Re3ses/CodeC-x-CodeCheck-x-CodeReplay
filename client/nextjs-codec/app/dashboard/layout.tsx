"use client";

import Nav from "./nav";
import { useQuery } from "@tanstack/react-query";
import { getUser, refreshToken } from "@/lib/auth";
import { useEffect } from "react";

export default function Layout({ children }: {
    children: React.ReactNode
}) {
    useEffect(() => {
        const res = async () =>  {
            await refreshToken()
        };
        res();
    }, []);

    const userQuery = useQuery({
        queryKey: ["user", 1],
        queryFn: async () => {
            const res = await getUser();
            return res;
        }
    });

    return (
        <div className="flex flex-col gap-4 ">
            <Nav name={userQuery.data?.auth?.username} type={userQuery.data?.type} />
            {children}
        </div>
    );
}
