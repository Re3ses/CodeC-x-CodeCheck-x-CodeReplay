import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { RoomSchemaInferredType } from '@/lib/interface/room';
import { GetRoom } from '@/utilities/apiService';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { BookOpen, Users, ClipboardCopy, FileCode, History, Crown } from 'lucide-react';
import { Trophy, Star, Target } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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
  totalProblems: number;
  solvedProblems: number;
}

interface RoomBannerProps {
  room: RoomSchemaInferredType;
  username: string;
  usertype: string;
  params: { slug: string };
  submissionStats?: {
    solvedProblems: number;
    totalProblems: number;
  };
}

export default function RoomBanner({
  room,
  username,
  usertype,
  params,
  submissionStats
}: RoomBannerProps) {
  const roomQuery = useQuery<RoomSchemaInferredType>({
    queryKey: ['room'],
    queryFn: async () => {
      const res = await GetRoom(params.slug!);
      return res;
    },
  });

  const submissionStatsQuery = useQuery<SubmissionStats>({
    queryKey: ['submissionStats', params.slug],
    queryFn: async () => {
      const response = await fetch(`/api/userSubmissions/stats?room_id=${params.slug}`);
      return response.json();
    },
    enabled: usertype === 'Learner'
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room?.slug);
    toast({
      title: "Invite Code Copied",
      description: `Room code ${room?.slug} has been copied to your clipboard.`,
    });
  };

  // Use submissionStats in the progress calculation
  const progressValue = submissionStats
    ? (submissionStats.solvedProblems / (room?.problems?.length || 1)) * 100
    : 0;

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
                  {submissionStatsQuery.data?.solvedProblems || 0}/{room?.problems?.length || 0}
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
