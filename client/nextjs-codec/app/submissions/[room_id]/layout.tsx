'use client';

import Nav from '@/app/dashboard/nav';
import { getUser } from '@/lib/auth';
import { redirect, useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Page from './page';

export default function SubmissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const params = useParams<{ room_id: string }>();
  const [user, setUser] = useState<any>();

  useEffect(() => {
    const req = async () => {
      await getUser().then((val) => {
        setUser(val);
        if (
          val.error ||
          val.message === 'Authentication failed: [JWT MALFORMED]'
        ) {
          router.push('/login');
        }
      });
    };

    req();
  }, [router]);

  return (
    <>
      <Nav type={user?.type} name={user?.auth?.username} />
      <div className="p-4">
        <Page type={{ type: user?.type }} />
      </div>
    </>
  );
}
