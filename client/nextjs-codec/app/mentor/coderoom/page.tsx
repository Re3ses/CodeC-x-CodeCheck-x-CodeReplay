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
import Loading from '@/components/loading';

export default function ClassroomManagement() {
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

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

  if (roomsQuery.isLoading) {
    return (
      <Loading message="Loading classrooms..." />
    );
  }

  function handleRoomDeletion(id: any) {
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

  const handleFormSubmit = (success: boolean) => {
    if (success) {
      setIsModalOpen(false); // Close the modal on successful submission
      roomsQuery.refetch(); // Refresh the data
    }
  }

  return (
    <Card className="w-full max-w-6xl mx-auto my-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div>
          <CardTitle className="text-2xl font-bold">Classrooms</CardTitle>
          <CardDescription>Manage your virtual classrooms and courses</CardDescription>
        </div>
        <Modal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          label={
            <div className='flex gap-2 items-center'>
              <Plus className="h-4 w-4" />
              New Classroom
            </div>
          }
          title="Create Classroom"
          description="Create a room where you can host your lectures, courses, or programming problems"
        >
          <CreateClassroomForm onFormSubmit={handleFormSubmit} />
        </Modal>
      </CardHeader>
      <CardContent>
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
              {roomsQuery.data?.map((room: any) => (
                <TableRow
                  key={room.id}
                  className={`grid grid-cols-12 w-full hover:bg-muted/50 relative
            ${room.dueDate && new Date() > new Date(room.dueDate) ? "opacity-50" : ""}`}
                >
                  {/* Invisible link covering the whole row except the action button area */}
                  <Link
                    className="absolute inset-0 w-9/12 cursor-pointer"
                    href={`/mentor/coderoom/r/${room.slug}?${searchParams}`}
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

                  <TableCell className="col-span-3 p-4 flex justify-end items-center gap-2 z-20">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 pointer-events-auto"
                      asChild
                    >
                      <Link
                        href={`/mentor/coderoom/r/${room.slug}?${searchParams}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <LogIn className="h-4 w-4" />
                        Enter
                      </Link>
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-2 pointer-events-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
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
