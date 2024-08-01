import React from 'react';

import BorderedContainer from './ui/wrappers/BorderedContainer';
import { RoomSchemaInferredType } from '@/lib/interface/room';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { GetRoom } from '@/utilities/apiService';
import { Button, buttonVariants } from './ui/button';
import { toast } from './ui/use-toast';
import { CopyIcon } from '@radix-ui/react-icons';
import LeaderboardTable from '../app/leaderboards/leaderboardTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export default function RoomBanner({
  room,
  username,
  usertype,
  params,
}: {
  room: RoomSchemaInferredType;
  username: string;
  usertype: string;
  params: { slug: string };
}) {
  const roomQuery = useQuery<RoomSchemaInferredType>({
    queryKey: ['room'],
    queryFn: async () => {
      const res = await GetRoom(params.slug!);
      return res;
    },
  });
  return (
    <BorderedContainer>
      <div className="flex p-5 gap-2 bg-card justify-between">
        <div className="my-auto flex gap-2">
          <p className="my-auto">{username}</p>
          <span className="bg-[gold] text-[black] text-sm px-4 h-fit my-auto w-fit rounded-lg">
            {usertype}
          </span>
        </div>
        <div className="text-right">
          <p className="text-2xl mb-2 text-zinc-500">{room?.name}</p>
          <div className="my-auto font-bold cursor-pointer hover:text-green-400 flex gap-2">
            <small className="text-zinc-500 font-normal">Invite Code: </small>
            <small
              onClick={() => {
                navigator.clipboard.writeText(room?.slug);
                toast({
                  title: `Room slug: ${room?.slug} copied to clipboard`,
                });
              }}
            >
              {room?.slug}
            </small>
            <CopyIcon />
          </div>
        </div>
      </div>
      <div className="flex flex-col text-center p-2 pt-4">
        <p>{room?.description}</p>
        <p className="text-sm text-zinc-500">{room?.type}</p>
      </div>
      <div className="flex justify-between p-5">
        {usertype == 'Mentor' && (
          <Link
            href={`/mentor/coderoom/problem-creation/${roomQuery.data?.slug}`}
            className={buttonVariants({ variant: 'default' })}
          >
            Create problem
          </Link>
        )}
        <Link
          href={`/submissions/${roomQuery.data?.slug}`}
          className={
            buttonVariants({ variant: 'ghost' }) + 'border border-zinc-700'
          }
        >
          Show room submissions
        </Link>
      </div>
    </BorderedContainer>
  );
}
