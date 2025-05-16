'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomSchemaInferredType } from '@/lib/interface/room';
import { GetRoom } from '@/utilities/apiService';
import { getUser } from '@/lib/auth';
import RoomBanner from '@/components/RoomBanner';
import RoomEnroleeList from '@/components/RoomEnroleeList';
import RoomProblemList from '@/components/RoomProblemList';
import { Users, BookOpen } from 'lucide-react';
import Loading from '@/components/loading';
import OwnershipCheck from '@/components/ui/auth/ownershipCheck/checkOwnership';

export default function ClassroomDetail({ params }: { params: { slug: string } }) {
  const userQuery = useQuery<any>({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await getUser();
      return res;
    },
  });

  const roomQuery = useQuery<RoomSchemaInferredType>({
    queryKey: ['room'],
    queryFn: async () => {
      const res = await GetRoom(params.slug!);
      return res;
    },
  });

  if (roomQuery.isLoading || userQuery.isLoading) {
    return (
      <Loading message="Loading classroom details..." />
    );
  }

  // useEffect(() => {
  //   console.log('Room data:', roomQuery.data);
  //   console.log('User data:', userQuery.data);
  //   console.log('roomQuery.data?.mentor?.id:', roomQuery.data?.mentor?.id);
  //   console.log('userQuery.data?.id:', userQuery.data?.id);
  //   console.log("Equality check:", roomQuery.data?.mentor?.id === userQuery.data?.id);
  // }, [roomQuery.data, userQuery.data]);

  const mentorId = (roomQuery.data?.mentor as any)?.id;

  if (roomQuery.isError || !roomQuery.data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-500">Room Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              The classroom you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
          </CardContent>
          <button
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded"
            onClick={() => window.location.href = '/dashboard'}
          >
            Go Back to Classroom List
          </button>
        </Card>
      </div>
    );
  }

  return (
    <OwnershipCheck
      ownerId={mentorId}
    >
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Banner Section */}
        <Card className="w-full">
          <CardContent className="p-6">
            <RoomBanner
              room={roomQuery.data}
              username={userQuery.data?.auth?.username}
              usertype={userQuery.data?.type}
              params={params}
            />
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="problems" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
            <TabsTrigger value="problems" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Problems
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
          </TabsList>

          <TabsContent value="problems">
            <Card>
              <CardContent className="p-6">
                {roomQuery.data?.problems?.length === 0 ? (
                  <p className='text-sm text-gray-500'>Create problems to solve for your students.</p>
                )
                  : (
                    <RoomProblemList params={params} />
                  )
                }
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardContent className="p-6">
                {roomQuery.data?.enrollees?.length === 0 ? (
                  <p className='text-sm text-gray-500'>No students have enrolled in this room yet.</p>
                ) : (
                  <RoomEnroleeList params={params} />
                )
                }
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OwnershipCheck>
  );
}
