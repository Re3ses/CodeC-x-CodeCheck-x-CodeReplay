'use client';
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Plus, Trash2, LogIn } from 'lucide-react';
import CreateClassroomForm from '@/components/ui/classroom/createClassroomForm';
import Modal from '@/components/ui/wrappers/Modal';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { GetMentorRooms } from '@/utilities/apiService';
import { toast } from '@/components/ui/use-toast';

export default function ClassroomManagement() {
  const searchParams = useSearchParams();

  const roomsQuery = useQuery({
    queryKey: ['rooms', 1],
    queryFn: async () => {
      const data = GetMentorRooms();
      if (!data) {
        throw new Error('failed to get room data');
      }
      return data;
    },
  });

  function handleRoomDeletion(id) {
    const deleteRoom = async () => {
      try {
        const response = await fetch(`/api/rooms?room_id=${id}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error(`Failed to delete room with id: ${id}`);
        }
        toast({ title: `Room successfully deleted` });
      } catch (e) {
        console.error('Failed to delete room: ', e);
        toast({ title: `Failed to delete room`, variant: "destructive" });
      }
    };

    deleteRoom();
    roomsQuery.refetch();
  }

  return (
    <Card className="w-full max-w-6xl mx-auto my-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div>
          <CardTitle className="text-2xl font-bold">Classrooms</CardTitle>
          <CardDescription>Manage your virtual classrooms and courses</CardDescription>
        </div>
        <Modal
          label={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Classroom
            </Button>
          }
          title="Create Classroom"
          description="Create a room where you can host your lectures, courses, or programming problems"
        >
          <CreateClassroomForm />
        </Modal>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Name</TableHead>
                <TableHead className="min-w-[300px]">Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomsQuery.data?.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell className="text-muted-foreground">{room.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/mentor/coderoom/r/${room.slug}?${searchParams}`}
                      >
                        <Button variant="outline" size="sm" className="gap-2">
                          <LogIn className="h-4 w-4" />
                          Enter
                        </Button>
                      </Link>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Classroom</DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. This will permanently delete the classroom
                              and all associated data from our servers.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button
                                variant="destructive"
                                onClick={() => handleRoomDeletion(room._id)}
                              >
                                Delete Classroom
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
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
