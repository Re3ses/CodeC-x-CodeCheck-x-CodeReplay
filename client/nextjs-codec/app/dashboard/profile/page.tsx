'use client';

import ChangePasswordForm from '@/components/ChangePasswordForm';
import LogoutDialogue from '@/components/LogoutDialogue';
import BorderedContainer from '@/components/ui/wrappers/BorderedContainer';
import { getUser } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';

export default function Page() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['user'],
    queryFn: async () => getUser(),
  });

  if (isLoading) return <div>Loading data...</div>;
  if (isError) return <div>Something BAD happened!!!</div>;

  return (
    <BorderedContainer customStyle="m-2 flex flex-col gap-2">
      <div className="p-5 bg-zinc-900 text-lg">
        <p>Profile settings</p>
        <p className="text-sm text-zinc-400">Account type: {data?.type}</p>
        <p className="text-sm text-zinc-400">
          Account name: {data.auth?.username}
        </p>
      </div>
      <div className="p-5">
        <BorderedContainer customStyle="w-fit mx-auto">
          <ChangePasswordForm />
        </BorderedContainer>
        <LogoutDialogue />
      </div>
    </BorderedContainer>
  );
}
