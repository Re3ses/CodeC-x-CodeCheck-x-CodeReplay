'use client';
import Nav from './nav';
import { useQuery } from '@tanstack/react-query';
import { getUser, refreshToken } from '@/lib/auth';
import { createContext, useEffect } from 'react';
import { UserContext } from './contexts';

export default function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const res = async () => {
      await refreshToken();
    };
    res();
  }, []);

  const userQuery = useQuery({
    queryKey: ['user', 1],
    queryFn: async () => {
      const res = await getUser();
      return res;
    },
  });

  return (
    <div className="h-screen flex flex-col gap-4 ">
      <Nav name={userQuery.data?.auth?.username} type={userQuery.data?.type} />

      {/* Data is undefined while fetching, if no data is loaded, it will stuck to waiting state */}
      {userQuery.data !== undefined ? (
        <>
          <UserContext.Provider value={userQuery.data}>
            {children}
          </UserContext.Provider>
        </>
      ) : (
        <small>Waiting for data, please be patient...</small>
      )}
    </div>
  );
}
