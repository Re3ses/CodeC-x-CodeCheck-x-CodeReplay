import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";

export default function Nav(props: { variant?: string, name?: string, type?: string }) {
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
        <div className="flex px-[20%] h-full justify-between">
            <div className="flex gap-10">
                <Image
                    src="/images/CodeC.svg"
                    width={70}
                    height={30}
                    alt="Picture of the author"
                />
                <Link
                    className="hover:underline m-auto text-sm"
                    href={`/${props.type?.toLowerCase()}/coderoom`}
                >
                    Rooms
                </Link>
                <Link
                    className="hover:underline m-auto text-sm"
                    href={`/${props.type?.toLowerCase()}/live-code`}
                >
                    Live Code
                </Link>
                <Link
                    className="hover:underline m-auto text-sm"
                    href={`/codebox`}
                >
                    Code box
                </Link>
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
