import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { getSession } from "@/lib/auth";

export default function HomeSection() {
    const { data, isLoading } = useQuery({
        queryKey: ["user"],
        queryFn: async () => getSession(),
    });

    if (isLoading) return <div>Loading data...</div>;
    return (
        <section
            id="home"
            className="min-h-screen flex justify-center flex-col text-center"
        >
            <span className="text-5xl p-5">Welcome to CodeC</span>
            <p>
                Empowering Minds: Unleashing the Fusion of Knowledge and Code -
                Your Ultimate Hub for Learning and Hacking Excellence
            </p>
            <div className="flex flex-row justify-center gap-4 m-4">
                {data?.username && data !== null ? (
                    <Link
                        href="/dashboard/profile"
                        className={buttonVariants()}
                    >
                        {data.username}
                    </Link>
                ) : (
                    <>
                        <Link
                            href="/sign-up"
                            className={buttonVariants({
                                variant: "greenbold",
                                size: "lg",
                            })}
                        >
                            Sign up
                        </Link>
                        <Link
                            href="/login"
                            className={buttonVariants({
                                variant: "default",
                                size: "lg",
                            })}
                        >
                            Login
                        </Link>
                    </>
                )}
            </div>
        </section>
    );
}
