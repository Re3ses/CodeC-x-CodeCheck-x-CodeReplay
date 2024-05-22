"use client"

import RegisterForm from "@/components/ui/auth/registerForm"
import Image from "next/image"

export default function Page() {
  return (
    <div className="flex justify-between items-center h-screen">
      <div className="bg-slate-200 hidden md:flex items-center justify-center h-full w-full">
        <Image
          src={"https://mir-s3-cdn-cf.behance.net/project_modules/hd/e4c02d32431337.5605bf79cdb42.jpg"}
          alt="something"
          width={500}
          height={500}
        />
      </div>
      <div className="w-full flex items-center justify-center">
        <div className="h-max w-full border border-solid m-10 p-4 shadow-lg rounded-lg">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}