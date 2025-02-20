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
    <Card className="mx-4 my-6">
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
              {roomsQuery.data?.map((item: RoomSchemaInferredType) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/learner/coderoom/r/${item.slug}`}>
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
    </Card>
  );
}
