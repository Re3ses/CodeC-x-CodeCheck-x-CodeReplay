'use client';

import React from 'react';
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

  if (!roomQuery.data) {
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
        </Card>
      </div>
    );
  }

  return (
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
              <RoomProblemList params={params} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardContent className="p-6">
              <RoomEnroleeList params={params} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
