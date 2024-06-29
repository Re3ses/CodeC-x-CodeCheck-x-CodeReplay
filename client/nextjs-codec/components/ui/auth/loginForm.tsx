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
    redirect("/");
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
              name={fieldName}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative w-full min-w-[200px] h-10">
                      <Input type={fieldName === "password" ? "password" : "text"} {...field} placeholder={fieldName} />
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
      <Link href="/sign-up" className="underline text-sm text-center">
        Create an account
      </Link>
    </div>
  );
}
