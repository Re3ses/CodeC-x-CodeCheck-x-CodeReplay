import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { RoomSchemaInferredType } from '@/lib/interface/room';
import { GetRoom } from '@/utilities/apiService';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { BookOpen, Users, ClipboardCopy, FileCode, History, Crown } from 'lucide-react';
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room?.slug);
    toast({
      title: "Invite Code Copied",
      description: `Room code ${room?.slug} has been copied to your clipboard.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{room?.name}</h1>
          <p className="text-muted-foreground">{room?.description}</p>
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{room?.problems?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{room?.enrollees?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Room Type</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{room?.type || "Standard"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {usertype === 'Mentor' && (
          <Button className="gap-2" asChild>
            <Link href={`/mentor/coderoom/problem-creation/${roomQuery.data?.slug}`}>
              <FileCode className="h-4 w-4" />
              Create Problem
            </Link>
          </Button>
        )}
        <Button variant="outline" className="gap-2" asChild>
          <Link href={`/submissions/${roomQuery.data?.slug}`}>
            <History className="h-4 w-4" />
            View Submissions
          </Link>
        </Button>
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">More Actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Room Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCopyCode}>
              Copy Invite Code
            </DropdownMenuItem>
            {usertype === 'Mentor' && (
              <>
                <DropdownMenuItem>Edit Room Details</DropdownMenuItem>
                <DropdownMenuItem>Manage Access</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>
        {/* For future implmentation */}
        {/* <Link
          href={`/comparisons/coderoom/${roomQuery.data?.slug}`}
          className={buttonVariants({ variant: 'ghost' })}
        >View Code Comparisons
        </Link> */}
    </div>
  );
}