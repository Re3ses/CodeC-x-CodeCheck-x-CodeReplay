"use client"

import RegisterForm from "@/components/ui/auth/registerForm"
import Image from "next/image"

export default function Page() {
  return (
    <div className="flex flex-col gap-10 items-center">
      <h1 className="text-3xl font-bold pt-20">Join the club!</h1>
      <div className="mx-auto">
        <RegisterForm />
      </div>
    </div>
  )
}
