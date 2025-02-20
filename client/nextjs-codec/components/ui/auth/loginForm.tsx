import { LoginSchema, LoginShemaInferredType } from '@/lib/interface/login';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, buttonVariants } from '../button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from '../use-toast';
import Link from 'next/link';
import { login } from '@/lib/auth';

export default function LoginForm({ type }: { type?: string }) {
  const [status, setStatus] = useState<number>();
  const router = useRouter();
  const path = type?.toLowerCase() || 'learner'; // Default to learner if no type provided

  const form = useForm<LoginShemaInferredType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginShemaInferredType) => {
    try {
      const res = await login(data);
      setStatus(res);

      toast({
        title: 'Successfully logged in!',
        description: 'You can now access your account',
      });

      // Use the path prop instead of localStorage
      router.push(`/${path}/coderoom`);
    } catch {
      form.setError('username', {
        message: 'Either username is taken or user does not exist',
      });
      form.setError('password', {
        message: 'Either password is wrong or user does not exist',
      });
      toast({
        variant: 'destructive',
        title: 'Error logging in',
        description: 'Please check your credentials',
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative w-full min-w-[200px] h-10">
                    <Input type="text" {...field} placeholder="username" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative w-full min-w-[200px] h-10">
                    <Input
                      type="password"
                      {...field}
                      placeholder={'password'}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={!form.formState.isValid}>
            Login
          </Button>
        </form>
      </Form>
      <Link href="/sign-up" className="underline text-sm text-center">
        Create an account
      </Link>
    </div>
  );
}
