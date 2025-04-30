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
        {/* <div className="flex items-center py-4">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            className="max-w-sm"
          />
        </div> */}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="grid grid-cols-12 w-full">
                <TableHead className="col-span-4 flex items-center">Name</TableHead>
                <TableHead className="col-span-5 flex items-center">Description</TableHead>
                <TableHead className="col-span-3 flex items-center justify-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomsQuery.data?.map((room: RoomSchemaInferredType) => (
                <TableRow
                  key={room.id}
                  className={`grid grid-cols-12 w-full hover:bg-muted/50 relative
            ${room.dueDate && new Date() > new Date(room.dueDate) ? "opacity-50" : ""}`}
                >
                  {/* Invisible link covering the whole row except the action button area */}
                  <Link
                    className="absolute inset-0 w-9/12 cursor-pointer"
                    href={`/learner/coderoom/r/${room.slug}`}
                    passHref
                    aria-label={`Enter ${room.name}`}
                  />

                  <TableCell className="col-span-4 p-4 font-medium flex items-center z-10 pointer-events-none">
                    {room.name}
                  </TableCell>

                  <TableCell className="col-span-5 p-4 text-muted-foreground flex items-start flex-col z-10 pointer-events-none">
                    {room.dueDate && (
                      <div className="flex items-center mb-2 text-sm">
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

                  <TableCell className="col-span-3 p-4 flex justify-end items-center z-20">
                    <Link
                      href={`/learner/coderoom/r/${room.slug}`}
                      className="pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
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
