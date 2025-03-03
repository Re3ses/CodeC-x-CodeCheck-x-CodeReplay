'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, Shield } from 'lucide-react';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import LogoutDialogue from '@/components/LogoutDialogue';
import { getUser } from '@/lib/auth';

export default function Page() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['user'],
    queryFn: async () => getUser(),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="mx-auto max-w-lg mt-8">
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p className="text-lg font-medium">Unable to load profile data</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please try refreshing the page or contact support if the issue persists.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Account Type</p>
              <p className="font-medium flex items-center gap-2 mt-1">
                <Shield className="h-4 w-4" />
                {data?.type}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Username</p>
              <p className="font-medium mt-1">{data.auth?.username}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-md mx-auto">
            <ChangePasswordForm />
          </div>
          <div className="pt-4 border-t">
            <LogoutDialogue />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}