"use client";

import RegisterForm from "@/components/ui/auth/registerForm";
import Image from "next/image";

export default function Page() {
  return (
    <div className="h-screen flex justify-center items-center my-auto">
      <RegisterForm />
      <div className="bg-card h-8 flex flex-col justify-center align-middle absolute bottom-0 w-full">
        <span className="m-auto text-sm text-white/50">
          © 2024 CodeC. All rights reserved. | AdNU
        </span>
      </div>
    </div>
  );
}
