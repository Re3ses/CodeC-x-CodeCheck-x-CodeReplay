'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ClassroomSchema,
  ClassroomShemaInferredType
} from '@/lib/interface/classroom';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface UpdateClassroomFormProps {
  onFormSubmit: (success: boolean) => void;
  classroom: {
    _id: string;
    name: string;
    description?: string;
    type?: string;
    releaseDate: Date | string;
    dueDate: Date | string;
  };
}

export default function UpdateClassroomForm({ onFormSubmit, classroom }: UpdateClassroomFormProps) {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  // Convert string dates to Date objects if needed
  const parsedClassroom = {
    ...classroom,
    releaseDate: classroom.releaseDate instanceof Date
      ? classroom.releaseDate
      : new Date(classroom.releaseDate),
    dueDate: classroom.dueDate instanceof Date
      ? classroom.dueDate
      : new Date(classroom.dueDate)
  };

  const form = useForm<ClassroomShemaInferredType>({
    resolver: zodResolver(ClassroomSchema),
    defaultValues: {
      name: parsedClassroom.name,
      description: parsedClassroom.description || '',
      type: parsedClassroom.type === 'Competitive' || parsedClassroom.type === 'Cooperative'
        ? parsedClassroom.type
        : 'Competitive',
      releaseDate: parsedClassroom.releaseDate,
      dueDate: parsedClassroom.dueDate,
    },
  });

  const onSubmit = async (data: ClassroomShemaInferredType) => {
    try {
      // Prepare payload with room_id
      const payload = {
        room_id: classroom._id,
        name: data.name,
        description: data.description,
        type: data.type,
        releaseDate: new Date(data.releaseDate),
        dueDate: new Date(data.dueDate),
      };

      console.log('Updating classroom with payload:', payload);

      const res = await fetch('/api/rooms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).then((res) => res.json()
      )

      if (res === 'error' || !res) {
        throw new Error('Failed to update classroom');
      }

      setSuccess(true);
      queryClient.refetchQueries({ queryKey: ['coderooms'] });
      queryClient.refetchQueries({ queryKey: ['coderoom', classroom._id] });

      onFormSubmit(true);

      toast({
        title: 'Classroom updated',
        description: 'The classroom has been successfully updated',
      });
    } catch (e) {
      console.error('Update classroom error:', e);
      onFormSubmit(false);
      toast({
        title: 'Error',
        description: 'Failed to update classroom',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter classroom name" {...field} />
                </FormControl>
                <FormDescription>
                  The name of your classroom
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter classroom description"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide a brief description of your classroom
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="releaseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Release Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When the classroom will be available to learners
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When assignments in this classroom are due
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={success}>
          Update Classroom
        </Button>
      </form>
    </Form>
  );
}