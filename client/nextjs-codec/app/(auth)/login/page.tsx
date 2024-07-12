'use client';

import LoginForm from '@/components/ui/auth/loginForm';
import Image from 'next/image';

export default function Page() {
  return (
    <div className="h-screen flex">
      <div className="bg-card flex flex-col gap-5 rounded-sm w-[350px] m-auto p-4">
        <div className="w-full flex flex-col justify-center align-middle p-10 text-center">
          <span className="text-white/50 text-sm">welcome to</span>
          <Image
            className="m-auto"
            src="images/CodeC.svg"
            alt="codec logo"
            width={120}
            height={120}
          />
        </div>
        <LoginForm />
      </div>
      <div className="bg-card h-8 flex flex-col justify-center align-middle absolute bottom-0 w-full">
        <span className="m-auto text-sm text-white/50">
          © 2024 CodeC. All rights reserved. | AdNU
        </span>
      </div>
    </div>
  );
}
