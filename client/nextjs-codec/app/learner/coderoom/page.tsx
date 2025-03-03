'use client';

import JoinRoomForm from '@/components/JoinRoomForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RoomSchemaInferredType } from '@/lib/interface/room';
import { GetLearnerRooms } from '@/utilities/apiService';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, Users } from 'lucide-react';

export default function Joined() {
  const roomsQuery = useQuery({
    queryKey: ['rooms', 1],
    queryFn: async () => await GetLearnerRooms(),
  });

  return (
    <Card className="w-full max-w-6xl mx-auto my-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div>
          <CardTitle className="text-2xl font-bold">Joined Rooms</CardTitle>
          <CardDescription>Manage your classroom enrollments</CardDescription>
        </div>
        <JoinRoomForm />
      </CardHeader>

      <CardContent>
        <div className="flex items-center py-4">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Room Name</TableHead>
                <TableHead className="max-w-[500px]">Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomsQuery.data?.map((room: RoomSchemaInferredType) => (
                <TableRow key={room.id} className={`cursor-pointer hover:bg-muted/50 
                  ${room.dueDate && new Date() > new Date(room.dueDate)
                    ? "opacity-50"
                    : ""
                  }`} >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {room.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {room.dueDate && (
                      <div className="flex items-center mt-2 text-sm">
                        <span className="font-medium mr-2">Due:</span>
                        <span className={`${new Date() > new Date(room.dueDate) ? "text-red-500" : "text-green-500"} font-medium`}>
                          {new Date(room.dueDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                    {room.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/learner/coderoom/r/${room.slug}`}>
                      <Button variant="default" size="sm">
                        Enter Room
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card >
  );
}
