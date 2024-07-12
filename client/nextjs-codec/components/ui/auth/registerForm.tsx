import { FormSchemaInferredType, FormSchema } from '@/lib/interface/signupForm';
import { useForm } from 'react-hook-form';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, buttonVariants } from '../button';
import { RegisterUser } from '@/utilities/apiService';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { toast } from '../use-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterForm() {
  const [success, setSuccess] = useState(false);

  const form = useForm<FormSchemaInferredType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      emailAddress: '',
      username: '',
      firstName: '',
      lastName: '',
      password: '',
      passwordConfirm: '',
    },
  });

  const onSubmit = async (data: FormSchemaInferredType) => {
    const payload = {
      email: data.emailAddress,
      first_name: data.firstName,
      last_name: data.lastName,
      username: data.username,
      type: data.userType,
      password: data.password,
    };
    const res = await RegisterUser(payload);

    if (res.emailExists || res.usernameExists) {
      if (res.emailExists) {
        form.setError('emailAddress', {
          message: 'Email exist, please choose another one',
        });
      }

      if (res.usernameExists) {
        form.setError('username', {
          message: 'Username taken, please choose another one',
        });
      }

      toast({
        title: 'Error signing up',
        description: 'Please check your credentials',
      });
    }

    if (res.accountCreated) {
      setSuccess(true);
      toast({
        title: 'Account successfully created!',
        description: `You can now log in with this account with the username ${payload.username}`,
      });
    }
  };

  if (success) {
    redirect('/login');
  }

  return (
    <div className="bg-card p-4 rounded-md flex flex-col w-[25em] gap-4">
      <div className="w-full flex flex-col justify-center align-middle p-5 text-center">
        <Image
          className="m-auto"
          src="images/CodeC.svg"
          alt="codec logo"
          width={120}
          height={120}
        />
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <FormField
            control={form.control}
            name="emailAddress"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="youremail@here.sample" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:gap-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Firstname</FormLabel>
                    <FormControl>
                      <Input placeholder="firstname" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Lastname</FormLabel>
                    <FormControl>
                      <Input placeholder="lastname" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="userType"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Account type</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Learner">Learner</SelectItem>
                      <SelectItem value="Mentor">Mentor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="password" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="passwordConfirm"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="confirm password"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <Button type="submit" disabled={!form.formState.isValid}>
            Create an account
          </Button>
        </form>
      </Form>
      <Link href="/login" className="underline text-center">
        Login instead
      </Link>
    </div>
  );
}
