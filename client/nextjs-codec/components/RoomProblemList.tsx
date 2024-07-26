import { ProblemSchemaInferredType } from '@/lib/interface/problem';
import { RoomSchemaInferredType } from '@/lib/interface/room';
import { GetRoom } from '@/utilities/apiService';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import BorderedContainer from './ui/wrappers/BorderedContainer';
import Link from 'next/link';
import { Button, buttonVariants } from './ui/button';
import { getUser } from '@/lib/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { revalidatePath } from 'next/cache';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from './ui/use-toast';

export default function RoomProblemList({
  params,
}: {
  params: { slug: string };
}) {
  const pathname = usePathname();
  const router = useRouter();

  const roomQuery = useQuery<RoomSchemaInferredType>({
    queryKey: ['room'],
    queryFn: async () => {
      const res = await GetRoom(params.slug!);
      return res;
    },
  });

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await getUser();
      return res;
    },
  });

  const handleDelete = (problemId: string) => {
    console.log('fadfsda');
    fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}${process.env.NEXT_PUBLIC_SERVER_PORT}/api/problems?problem_id=${problemId}`,
      { method: 'DELETE' }
    ).then(async (value) => {
      const res = await value.json();

      // force Refresh page
      location.reload();

      console.log(pathname, res);
    });
  };

  return (
    <div className="h-fit lg:grid sm:w-full sm:flex sm:flex-col grid-cols-4 gap-2">
      {roomQuery.data?.problems.map(
        (item: ProblemSchemaInferredType, index: number) => {
          return (
            <BorderedContainer customStyle="h-fit" key={index}>
              <div className="text-md bg-zinc-900 p-5 flex justify-between align-middle">
                <p className="self-center">{item.name}</p>
              </div>
              <div className="p-2 w-full">
                {userQuery.data?.type === 'Mentor' ? (
                  <div className="text-md p-2 flex justify-between align-middle">
                    <Link
                      href={`/mentor/coderoom/r/${params.slug}/problem/${item.slug}`}
                      className={buttonVariants({
                        variant: 'default',
                      })}
                    >
                      View
                    </Link>
                    <Dialog>
                      <DialogTrigger
                        className={buttonVariants({ variant: 'destructive' })}
                      >
                        Delete
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Are you absolutely sure?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently
                            delete the creted problem and remove the data from
                            our servers.
                          </DialogDescription>
                        </DialogHeader>

                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(item._id!)}
                        >
                          Confirm deletion
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="text-md p-2 flex justify-between align-middle">
                    <Link
                      href={`/learner/coderoom/r/${params.slug}/problem/${item.slug}`}
                      className={buttonVariants({
                        variant: 'default',
                      })}
                    >
                      Solve
                    </Link>
                  </div>
                )}
              </div>
            </BorderedContainer>
          );
        }
      )}
    </div>
  );
}
