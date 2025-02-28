'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  ClassroomSchema,
  ClassroomShemaInferredType,
} from '@/lib/interface/classroom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { CreateRoom } from '@/utilities/apiService';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getSession } from '@/lib/auth';
import { Textarea } from '../textarea';
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export default function CreateClassroomForm() {
  const queryClient = useQueryClient();

  const [success, setSuccess] = useState(false);

  const { toast } = useToast();

  const form = useForm<ClassroomShemaInferredType>({
    resolver: zodResolver(ClassroomSchema),
    defaultValues: {
      type: 'Competitive',
      releaseDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  const onSubmit = async (data: ClassroomShemaInferredType) => {
    try {
      const session = await getSession();
      const username = await session.username;

      // Ensure dates are properly formatted
      const payload = {
        name: data.name,
        description: data.description,
        type: data.type,
        mentor: username,
        releaseDate: new Date(data.releaseDate),
        dueDate: new Date(data.dueDate),
      };

      console.log('Submitting payload:', payload); // Debug log

      const res = await CreateRoom(payload);

      if (res === 'error') {
        throw new Error('Failed to create classroom');
      }

      setSuccess(true);
      queryClient.refetchQueries({ queryKey: ['coderooms'] }); // Update query key

      toast({
        title: 'Coderoom created',
        description: 'You can see the invite code in the room itself',
      });
    } catch (e) {
      console.error('Create room error:', e);
      toast({
        title: 'Error',
        description: 'Failed to create classroom',
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
                <FormControl>
                  <Input placeholder="Room Name" {...field} />
                </FormControl>
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
                <FormControl>
                  <Textarea
                    placeholder="Description"
                    {...field}
                  />
                </FormControl>
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
              <FormItem>
                <FormLabel>Release Date</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Input
                      type="date"
                      {...field}
                      value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                      onChange={e => field.onChange(new Date(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Input
                      type="date"
                      {...field}
                      value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                      onChange={e => field.onChange(new Date(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={success}>
          Create room
        </Button>
      </form>
    </Form>
  );
}
