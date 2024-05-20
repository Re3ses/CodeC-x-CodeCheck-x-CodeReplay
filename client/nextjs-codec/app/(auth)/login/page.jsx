"use client"

import LoginForm from "@/components/ui/auth/loginForm"
import Image from "next/image"

export default function Page() {
  return (
    <div className="flex justify-between items-center h-screen">
      <div className="hidden md:flex justify-center items-center bg-slate-300 w-full h-screen">
        <Image
          src={"https://mir-s3-cdn-cf.behance.net/project_modules/hd/e4c02d32431337.5605bf79cdb42.jpg"}
          alt="something"
          width={500}
          height={500}
        />
      </div>
      <div className="flex flex-col gap-10 justify-center items-center w-full h-screen">
        <div className="flex flex-col text-center gap-4">
          <span className="text-3xl">CodeC Account Login</span>
          <span className="text-xl">Welcome back!</span>
        </div>
        <div className="border border-solid rounded-lg shadow-lg p-4">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}