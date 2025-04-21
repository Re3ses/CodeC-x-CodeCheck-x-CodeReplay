'use client';
import Nav from './nav';
import { useQuery } from '@tanstack/react-query';
import { getUser, refreshToken } from '@/lib/auth';
import { createContext } from 'react';
import { UserContext } from './contexts';
<<<<<<< HEAD
import LoadingAnimation from './loading';
=======
import Loading from '@/components/loading';
>>>>>>> main

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', 1],
    queryFn: async () => {
      try {
        await refreshToken();
        const user = await getUser();
        console.log("Fetched user:", user);
        return user;
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
  });

  return (
    <div className="h-screen flex flex-col gap-4">
      <Nav name={user?.auth?.username} type={user?.type} />

      {user !== undefined ? (
        <UserContext.Provider value={user}>{children}</UserContext.Provider>
      ) : (
<<<<<<< HEAD
        <LoadingAnimation />
=======
        <Loading message="Loading" />
>>>>>>> main
      )}
    </div>
  );
}
