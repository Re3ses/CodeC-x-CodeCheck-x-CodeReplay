import { LoginSchema, LoginShemaInferredType } from "@/lib/interface/login";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonVariants } from "../button";
import { redirect } from "next/navigation";
import { useState } from "react";
import { toast } from "../use-toast";
import Link from "next/link";
import { login } from "@/lib/auth";

export default function LoginForm() {
  const [status, setStatus] = useState<number>();

  const form = useForm<LoginShemaInferredType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginShemaInferredType) => {
    try {
      const res = await login(data);
      setStatus(res);
      toast({
        title: "Successfully logged in!",
        description: "You can now access your account",
      });
    } catch {
      form.setError("username", {
        message: "Either username is taken or user does not exist",
      });
      form.setError("password", {
        message: "Either password is wrong or user does not exist",
      });
      toast({
        variant: "destructive",
        title: "Error logging in",
        description: "Please check your credentials",
      });
    }
  };

  if (status === 200) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          {["username", "password"].map((fieldName, index) => (
            <FormField
              key={index}
              control={form.control}
              name={`${fieldName}`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative w-full min-w-[200px] h-10">
                      <input
                        type={fieldName === "password" ? "password" : "text"}
                        className="peer w-full h-full bg-transparent text-gray-700 font-sans font-normal outline-none focus:outline-none disabled:bg-blue-gray-50 disabled:border-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 border focus:border-2 focus:border-t-transparent text-sm px-3 py-2.5 rounded-[7px] border-blue-gray-200 focus:border-blue-500"
                        placeholder=" "
                        {...field}
                      />
                      <label className="flex w-full h-full select-none pointer-events-none absolute left-0 font-normal peer-placeholder-shown:text-gray-500 leading-tight peer-focus:leading-tight peer-disabled:text-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500 transition-all -top-1.5 peer-placeholder-shown:text-sm text-[11px] peer-focus:text-[11px] before:content-[''] before:block before:box-border before:w-2.5 before:h-1.5 before:mt-[6.5px] before:mr-1 peer-placeholder-shown:before:border-transparent before:rounded-tl-md before:border-t peer-focus:before:border-t-2 before:border-l peer-focus:before:border-l-2 before:pointer-events-none before:transition-all peer-disabled:before:border-transparent after:content-[''] after:block after:flex-grow after:box-border after:w-2.5 after:h-1.5 after:mt-[6.5px] after:ml-1 peer-placeholder-shown:after:border-transparent after:rounded-tr-md after:border-t peer-focus:after:border-t-2 after:border-r peer-focus:after:border-r-2 after:pointer-events-none after:transition-all peer-disabled:after:border-transparent peer-placeholder-shown:leading-[3.75] text-blue-gray-400 peer-focus:text-blue-500 before:border-blue-gray-200 peer-focus:before:border-blue-500 after:border-blue-gray-200 peer-focus:after:border-blue-500">
                        {fieldName}
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <Button type="submit" disabled={!form.formState.isValid}>
            Login
          </Button>
        </form>
      </Form>
      <Link href="/sign-up" className="underline text-xl text-center">
        Create an account
      </Link>
    </div>
  );
}
