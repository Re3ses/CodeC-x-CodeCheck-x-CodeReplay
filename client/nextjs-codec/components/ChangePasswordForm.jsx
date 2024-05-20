import React, { useState } from "react"
import { toast } from "./ui/use-toast"
import { ChangePass } from "@/utilities/apiService"
import { Input } from "./ui/input"
import { useForm } from "react-hook-form"
import { Button } from "./ui/button"
import { Label } from "./ui/label"

export default function ChangePasswordForm() {
    const [same, setSame] = useState(Boolean)

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm()

    const onSubmit = async data => {
        if (
            data.password === data.confirmPass &&
            data.password.length >= 8 &&
            data.confirmPass.length >= 8
        ) {
            await ChangePass(data.old, data.confirmPass)
                .then(() => {
                    toast({
                        description:
                            "Password changed, this will take effect after you log out or login to another session"
                    })
                })
                .catch(() => {
                    toast({
                        description: "Something went wrong changing your password...",
                        variant: "destructive"
                    })
                })
            setSame(true)
        } else {
            setSame(false)
            if (!(data.password.length >= 8 && data.confirmPass.length >= 8)) {
                toast({
                    description: "Password must be atleast 8 characters",
                    variant: "destructive"
                })
            }
            toast({
                description: "Something went wrong, check your inputs",
                variant: "destructive"
            })
        }
    }
    return (
        <div className="max-w-lg flex flex-col gap-2">
            <p className="text-lg bg-zinc-900 p-3">Change password</p>
            <form
                className="flex flex-col gap-2 p-3 justify-center align-middle"
                onSubmit={handleSubmit(onSubmit)}
            >
                <div>
                    <Label htmlFor="old">Old password</Label>
                    <Input
                        type="password"
                        placeholder="old password"
                        {...register("old", { required: true })}
                    />
                    {errors.old && <span className="text-[red]">Field is required</span>}
                </div>
                <div>
                    <Label htmlFor="password">New password</Label>
                    <Input
                        type="password"
                        placeholder="new password"
                        {...register("password", { required: true })}
                    />
                    {errors.password && (
                        <span className="text-[red]">Field is required</span>
                    )}
                </div>
                <div>
                    <Input
                        type="password"
                        placeholder="confirm password"
                        {...register("confirmPass", { required: true })}
                    />
                    {errors.confirmPass && (
                        <span className="text-red-500">Field is required</span>
                    )}
                    {same === false && (
                        <span className="text-red-500">Password must match</span>
                    )}
                </div>
                <Button
                    variant="default"
                    type="submit"
                    className="flex align-middle justify-center"
                >
                    Confirm change
                </Button>
            </form>
        </div>
    )
}

