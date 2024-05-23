"use client"

import LoginForm from "@/components/ui/auth/loginForm"
import Image from "next/image"

export default function Page() {
  return (
    <div className="flex flex-col justify-center gap-5 my-[15%]">
      <h1 className="text-3xl text-center font-bold">Welcome back!</h1>
      <div className="mx-auto w-[20%]">
        <LoginForm />
      </div>
    </div>
  )
}
