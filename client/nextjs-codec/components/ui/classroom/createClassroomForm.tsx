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

export default function CreateClassroomForm() {
  const queryClient = useQueryClient();

  const [success, setSuccess] = useState(false);

  const { toast } = useToast();

  const form = useForm<ClassroomShemaInferredType>({
    resolver: zodResolver(ClassroomSchema),
    defaultValues: {
      type: 'Competitive',
    },
  });

  const onSubmit = async (data: ClassroomShemaInferredType) => {
    try {
      const session = await getSession();
      const username = await session.username;
      const payload = {
        name: data.name,
        description: data.description,
        type: 'Cooperative' as 'Competitive' | 'Cooperative',
        mentor: username,
      };
      const res = await CreateRoom(payload);

      setSuccess(res !== 'error');

      console.log(res);

      queryClient.refetchQueries({ queryKey: ['rooms'] });

      toast({
        title: 'Coderoom created',
        description: 'You can see the invite code in the room itself',
      });
    } catch (e) {
      console.log(e);
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
        <Button type="submit" disabled={success}>
          Create room
        </Button>
      </form>
    </Form>
  );
}
