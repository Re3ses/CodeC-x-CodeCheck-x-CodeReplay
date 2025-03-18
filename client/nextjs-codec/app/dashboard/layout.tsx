'use client';
import Nav from './nav';
import { useQuery } from '@tanstack/react-query';
import { getUser, refreshToken } from '@/lib/auth';
import { createContext } from 'react';
import { UserContext } from './contexts';

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
        <div className="p-6 border border-gray-700 rounded-lg bg-gray-800/50">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="text-sm text-gray-400">Waiting for data, please be patient...</div>
              <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-blue-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
