'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { revalidatePath } from 'next/cache';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav(props: {
  variant?: string;
  name?: string;
  type?: string;
}) {
  function Links() {
    const pathname = usePathname();

    // const path = pathname.startsWith('/dashboard')
    //   ? props.type?.toLowerCase()
    //   : pathname.startsWith('/mentor')
    //     ? 'mentor'
    //     : 'learner';

    const path = props.type?.toLowerCase();

    return (
      <div className="flex gap-4 jusify-center self-center">
        {[
          {
            id: 'dashboard',
            label: 'Dashboard',
            href: `/dashboard`,
          },
          {
            id: 'coderoom',
            label: 'Code room',
            href: `/${path}/coderoom`,
          },
          {
            id: 'codebox',
            label: 'Code box',
            href: `/codebox`,
          },
          {
            id: 'leaderboards',
            label: 'Leaderboards',
            href: '/leaderboards?page=1&perPage=10',
          },
        ].map(({ label, href, id }) => (
          <Link
            className={pathname.endsWith(id) ? 'underline' : ''}
            key={label}
            href={href}
            onClick={() => {
              revalidatePath(`${href}`);
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    );
  }

  if (props.variant == 'Compact') {
    return (
      <div className="flex px-2 justify-between bg-card">
        <Link href="/dashboard" className="my-auto">
          <Image
            src="/images/CodeC.svg"
            width={70}
            height={25}
            alt="Picture of the author"
          />
        </Link>
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src="/images/CodeC.svg" />
            <AvatarFallback>P</AvatarFallback>
          </Avatar>
          <Link
            className="px-2 text-sm text-[black] rounded-lg bg-[gold] hover:bg-[#78620A] hover:text-[white] m-auto"
            href="/dashboard/profile"
          >
            {props.name}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex px-4 py-3 justify-between bg-card">
      {Links()}
      <div className="flex gap-4">
        <Avatar>
          <AvatarImage src="/images/CodeC.svg" />
          <AvatarFallback>P</AvatarFallback>
        </Avatar>
        <Link
          className="px-2 text-sm text-[black] rounded-lg bg-[gold] hover:bg-[#78620A] hover:text-[white] m-auto"
          href="/dashboard/profile"
        >
          {props.name}
        </Link>
      </div>
    </div>
  );
}
