'use client';

import { RoomSchemaInferredType } from '@/lib/interface/room';
import { GetRoom } from '@/utilities/apiService';
import { useQuery } from '@tanstack/react-query';
import RoomBanner from '@/components/RoomBanner';
import RoomEnroleeList from '@/components/RoomEnroleeList';
import RoomProblemList from '@/components/RoomProblemList';
import { getUser } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Code, Layout } from 'lucide-react';

export default function Page({ params }: { params: { slug: string } }) {
  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await getUser();
      return res;
    },
  });

  const roomQuery = useQuery<RoomSchemaInferredType>({
    queryKey: ['room', 3],
    queryFn: async () => {
      const res = await GetRoom(params.slug!);
      return res;
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Room Banner Section */}
      <Card className="bg-card">
        <CardContent className="p-6">
          <RoomBanner
            room={roomQuery.data!}
            username={userQuery.data?.auth.username}
            usertype={userQuery.data?.type}
            params={params}
          />
        </CardContent>
      </Card>

      {/* Main Content Section */}
      <Tabs defaultValue="problems" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="problems" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Problems
          </TabsTrigger>
          <TabsTrigger value="enrollees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Classmates
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="problems" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <RoomProblemList params={params} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollees" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <RoomEnroleeList params={params} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Room Details</h3>
                  <div className="text-muted-foreground">
                    {roomQuery.data?.description}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-secondary rounded-lg">
                      <div className="text-2xl font-bold">
                        {/* Add actual stats here */}
                        12
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Problems
                      </div>
                    </div>
                    <div className="p-4 bg-secondary rounded-lg">
                      <div className="text-2xl font-bold">
                        {/* Add actual stats here */}
                        24
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Active Users
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}