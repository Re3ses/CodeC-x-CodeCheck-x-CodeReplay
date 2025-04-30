// RoomBanner.tsx with updated stats handling
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { RoomSchemaInferredType } from '@/lib/interface/room';
import { GetRoom } from '@/utilities/apiService';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { BookOpen, Users, ClipboardCopy, FileCode } from 'lucide-react';
import { Target } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getUser } from '@/lib/auth';

// Add this helper function at the top of the file
function formatDate(date: string | Date | undefined) {
  if (!date) return 'Not set';
  try {
    return format(new Date(date), "PPP");
  } catch (error) {
    return 'Invalid date';
  }
}

interface SubmissionStats {
  solvedProblems: number;
  details?: Array<{
    _id: string;
    highestScore: number;
    submissionDetails: {
      submission_id: string;
      score: number;
      score_overall_count: number;
    };
  }>;
  success: boolean;
}

interface RoomBannerProps {
  room: RoomSchemaInferredType;
  username: string;
  usertype: string;
  params: { slug: string };
}

export default function RoomBanner({
  room,
  username,
  usertype,
  params,
}: RoomBannerProps) {
  const roomQuery = useQuery<RoomSchemaInferredType>({
    queryKey: ['room', params.slug],
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
    enabled: usertype === 'Learner'
  });

  const submissionStatsQuery = useQuery<SubmissionStats>({
    queryKey: ['submissionStats', params.slug, userQuery.data?.id],
    queryFn: async () => {
      const response = await fetch(`/api/userSubmissions/stats?room_id=${params.slug}&learner_id=${userQuery.data?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch submission stats');
      }
      return response.json();
    },
    enabled: usertype === 'Learner' && !!userQuery.data?.id
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room?.slug);
    toast({
      title: "Invite Code Copied",
      description: `Room code ${room?.slug} has been copied to your clipboard.`,
    });
  };

  // Calculate progress value
  const totalProblems = room?.problems?.length || 0;
  const solvedProblems = submissionStatsQuery.data?.solvedProblems || 0;
  const progressValue = totalProblems > 0 ? (solvedProblems / totalProblems) * 100 : 0;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("Submission Stats:", submissionStatsQuery.data);
      console.log("Progress Value:", progressValue);
      console.log("Total Problems:", totalProblems);
      console.log("Solved Problems:", solvedProblems);
    }
  }, [submissionStatsQuery.data, progressValue, totalProblems, solvedProblems]);

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{room?.name}</h1>
          <p className="text-muted-foreground">{room?.description}</p>
          <div className="flex gap-2 text-xs text-muted-foreground mt-1">
            <span>Opens: {formatDate(room?.releaseDate)}</span>
            <span>•</span>
            <span>Due: {formatDate(room?.dueDate)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-normal">
            {usertype}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleCopyCode}
          >
            <ClipboardCopy className="h-4 w-4" />
            {room?.slug}
          </Button>
          {usertype === 'Mentor' && (
            <Button size="sm" className="gap-2" asChild>
              <Link href={`/mentor/coderoom/problem-creation/${roomQuery.data?.slug}`}>
                <FileCode className="h-4 w-4" />
                Create Problem
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4">
        {usertype === 'Learner' ? (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
              <Target className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-sm font-medium">Challenge Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress
                    value={progressValue}
                    className="h-2"
                  />
                </div>
                <div className="text-sm font-medium">
                  {solvedProblems}/{totalProblems}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{room?.problems?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Problems in this room</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enrolled Students</CardTitle>
                <Users className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{room?.enrollees?.length || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}