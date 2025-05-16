'use client';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import UpdateClassroomForm from './updateClassroomForm';

interface UpdateClassroomDialogProps {
  room: {
    id: string;
    name: string;
    description?: string;
    dueDate?: string;
    slug: string;
  };
  onSuccess: () => void;
}




export function EditClassroomDialog({ room, onSuccess }: UpdateClassroomDialogProps) {
  const closeRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Classroom</DialogTitle>
          <DialogDescription>
            Make changes to your classroom settings
          </DialogDescription>
        </DialogHeader>
        <UpdateClassroomForm
          classroom={{
            _id: room.id,
            name: room.name,
            description: room.description,
            releaseDate: new Date(), // Default to current date since it's not provided
            dueDate: room.dueDate ? new Date(room.dueDate) : new Date(),
          }}
          onFormSubmit={(success) => {
            if (success) {
              onSuccess();
              closeRef.current?.click();
            }
          }}
        />
        <DialogClose ref={closeRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default EditClassroomDialog;