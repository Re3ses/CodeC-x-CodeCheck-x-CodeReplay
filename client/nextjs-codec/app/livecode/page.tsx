"use client";

import Nav from "../dashboard/nav";
import { SubmitHandler, useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { GetMentorRooms, GetRooms } from "@/utilities/apiService";
import Loading from "../dashboard/profile/loading";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

type Inputs = {
    problem_slug: string;
    room_slug: string;
    live_room_slug: string;
};

export default function Page() {
    const {
        register,
        handleSubmit,
        watch, // for live logging form input
        formState: { errors },
    } = useForm<Inputs>();
    const onSubmit: SubmitHandler<Inputs> = (data: any) => {
        console.log(data);
    };
    const { isPending, isError, error, data } = useQuery({
        queryKey: ["rooms"],
        queryFn: async () => await GetMentorRooms(),
    });

    if (isPending) return <Loading />;
    if (isError) return "An error has occured" + error.message;
    return (
        <>
            <Nav />
            <div className="flex flex-col gap-4 mx-[20%]">
                <div className="flex flex-col gap-2 py-2">
                    <p>Host live session</p>
                    <form
                        className="flex flex-col gap-2 max-w-md p-2 bg-[#1E2638] rounded-lg"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <input
                            className="py-1 px-3 bg-[#444D64] rounded-[100px]"
                            {...register("problem_slug", { required: true })}
                            placeholder="problem_slug"
                        />
                        {errors.problem_slug && (
                            <span className="text-[red]">
                                This field is required
                            </span>
                        )}
                        <Button
                            type="submit"
                            variant="default"
                            className="w-fit mx-auto"
                        >
                            Host session
                        </Button>
                    </form>
                </div>
                <div className="flex flex-col gap-2">
                    <p>Join live session</p>
                    <div className="flex flex-col gap-2 max-w-md bg-[#1E2638] rounded-lg">
                        <div className="flex gap-2 p-2 mx-auto">
                            <Label htmlFor="mentor-learner" className="my-auto">
                                As learner
                            </Label>
                            <Switch
                                name="mentor-learner"
                                defaultChecked={true}
                            />
                            <Label htmlFor="mentor-learner" className="my-auto">
                                As mentor
                            </Label>
                        </div>
                        <form
                            className="flex flex-col gap-2 max-w-md p-2 bg-[#1E2638] rounded-lg"
                            onSubmit={handleSubmit(onSubmit)}
                        >
                            <input
                                className="py-1 px-3 bg-[#444D64] rounded-[100px]"
                                {...register("live_room_slug", {
                                    required: true,
                                })}
                                placeholder="live_room_slug"
                            />
                            {errors.problem_slug && (
                                <span className="text-[red]">
                                    This field is required
                                </span>
                            )}
                            <Button
                                type="submit"
                                variant="default"
                                className="w-fit mx-auto"
                            >
                                Join live room
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
