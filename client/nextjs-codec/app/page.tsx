"use client";

import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
    return (
        <div className="lg:ml-[25%] lg:mr-[25%] md:ml-[10%] md:mr-[10%] flex flex-col h-screen justify-center">
            <div className="flex justify-center p-4 mt-5">
                <Link
                    href="/login"
                    className="underline text-xl"
                >
                    Login/Sign up
                </Link>
            </div>
            <div className="flex gap-[5rem] mx-auto my-auto">
                <h1 className="font-bold text-4xl self-center">CodeC</h1>
                <span className="self-center text-lg">an</span>
                <div className="self-center flex gap-3">
                    <h2 className="self-center text-3xl">Online</h2>
                    <div className="flex flex-col self-center text-left">
                        <h2 className="text-3xl text-zinc-500">code editor</h2>
                        <h2 className="text-3xl underline">classroom</h2>
                        <h2 className="text-3xl text-zinc-500">colaboration tool</h2>
                    </div>
                </div>
            </div>
        </div>
    );
}
