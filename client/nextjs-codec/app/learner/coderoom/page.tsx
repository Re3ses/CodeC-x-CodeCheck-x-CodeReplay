'use client';

import JoinRoomForm from '@/components/JoinRoomForm';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BorderedContainer from '@/components/ui/wrappers/BorderedContainer';
import { RoomSchemaInferredType } from '@/lib/interface/room';
import { GetLearnerRooms } from '@/utilities/apiService';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { FormEventHandler } from 'react';
import FormEvent from 'react';

export default function Joined() {
  const roomsQuery = useQuery({
    queryKey: ['rooms', 1],
    queryFn: async () => await GetLearnerRooms(),
  });

  return (
    <BorderedContainer customStyle="flex flex-col m-4 text-card-foreground min-w-[580px]">
      <div className="p-4 flex flex-col gap-2 justify-between items-center sm:flex-row">
        <div className="flex flex-col justify-center gap-1 items-center sm:items-start">
          <h2 className="text-2xl font-bold">Joined rooms</h2>
          <p className="text-muted-foreground">List of joined classroom</p>
        </div>

        <JoinRoomForm />
      </div>
      <div className="flex flex-col gap-2 p-5 sm:grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {roomsQuery.data?.map((item: RoomSchemaInferredType) => {
          return (
            <BorderedContainer
              key={item.id}
              customStyle="bg-card text-card-foreground flex flex-col gap-4 justify-center items-center p-4"
            >
              <div className="flex flex-col">
                <span className="text-lg font-bold my-auto text-center">
                  {item.name}
                </span>
                <span className="text-sm text-muted-foreground text-center">
                  {item.description}
                </span>
              </div>
              <Link
                href={`/learner/coderoom/r/${item.slug}`}
                className={`${buttonVariants({ variant: 'default' })} w-full`}
              >
                Enter
              </Link>
            </BorderedContainer>
          );
        })}
      </div>
    </BorderedContainer>
  );
}
