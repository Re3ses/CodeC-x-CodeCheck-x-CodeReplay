"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav(props: { variant?: string, name?: string, type?: string }) {
    function links() {
        const pathname = usePathname();

        const path = pathname.startsWith("/dashboard") ? props.type?.toLowerCase() : pathname.startsWith("/mentor") ? "mentor" : "learner"

        return (
            <div className="flex gap-4 jusify-center self-center">
                {
                    [
                        {
                            id: "coderoom",
                            label: "Code room",
                            href: `/${path}/coderoom`
                        },
                        {
                            id: "codebox",
                            label: "Code box",
                            href: `/codebox`
                        },
                    ].map(({ label, href, id }) => (
                        <Link
                            className={pathname.endsWith(id) ? "underline" : ""}
                            key={label}
                            href={href}
                        >{label}</Link>
                    ))
                }
            </div>

        );
    }

    if (props.variant == "Compact") {
        return (
            <div className="flex px-2 justify-between">
                <Link href="/dashboard" className="my-auto">
                    <Image
                        src="/images/CodeC.svg"
                        width={70}
                        height={25}
                        alt="Picture of the author"
                    />
                </Link>
                <div className="flex gap-4">
                    <Avatar>
                        <AvatarImage src="/images/CodeC.svg" />
                        <AvatarFallback>P</AvatarFallback>
                    </Avatar>
                    <Link
                        className="px-2 text-sm text-[black] rounded-lg bg-[gold] hover:bg-[#78620A] hover:text-[white] m-auto"
                        href="/dashboard/profile"
                    >
                        {props.name}
                    </Link>
                </div>
            </div>
        );
    }
    return (
        <div className="flex h-fit px-5 py-4 justify-between">
            <div className="flex gap-10">
                <Image
                    src="/images/CodeC.svg"
                    width={70}
                    height={30}
                    alt="Picture of the author"
                />
                {links()}
            </div>
            <div className="flex gap-4">
                <Avatar>
                    <AvatarImage src="/images/CodeC.svg" />
                    <AvatarFallback>P</AvatarFallback>
                </Avatar>
                <Link
                    className="px-2 text-sm text-[black] rounded-lg bg-[gold] hover:bg-[#78620A] hover:text-[white] m-auto"
                    href="/dashboard/profile"
                >
                    {props.name}
                </Link>
            </div>
        </div>
    );
}
