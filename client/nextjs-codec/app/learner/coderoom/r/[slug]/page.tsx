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

interface SubmissionStats {
  solvedProblems: number;
  totalProblems: number;
}

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

  const submissionStatsQuery = useQuery<SubmissionStats>({
    queryKey: ['submissionStats', params.slug],
    queryFn: async () => {
      const response = await fetch(`/api/userSubmissions/stats?room_id=${params.slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch submission stats');
      }
      const data = await response.json();
      return {
        solvedProblems: data.perfectScoreCount || 0,
        totalProblems: roomQuery.data?.problems?.length || 0
      };
    },
    enabled: !!roomQuery.data && userQuery.data?.type === 'Learner'
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
            submissionStats={submissionStatsQuery.data}
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
      </Tabs>
    </div>
  );
}
