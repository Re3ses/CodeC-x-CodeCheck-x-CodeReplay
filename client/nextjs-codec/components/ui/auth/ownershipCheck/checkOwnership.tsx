'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface OwnershipCheckProps {
  /**
   * The ID of the owner (mentor/creator) of the resource
   */
  ownerId: string | undefined;

  /**
   * The list of enrollees in a room
   */
  enrollees?: any[];

  /**
   * Optional custom error message
   */
  errorMessage?: string;

  /**
   * Optional redirect path if access is denied
   */
  redirectPath?: string;

  /**
   * The content to render if access is granted
   */
  children: React.ReactNode;

  /**
   * Optional fallback component to show while checking
   */
  loadingComponent?: React.ReactNode;

  /**
   * Optional access denied component
   */
  accessDeniedComponent?: React.ReactNode;

  /**
   * Whether to automatically redirect on access denied
   */
  autoRedirect?: boolean;

  /**
   * Delay before redirecting (in ms)
   */
  redirectDelay?: number;
}

export default function OwnershipCheck({
  ownerId,
  errorMessage = "You don't have permission to access this resource",
  redirectPath = '/dashboard',
  children,
  loadingComponent,
  accessDeniedComponent,
  autoRedirect = false,
  redirectDelay = 3000
}: OwnershipCheckProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Fetch the current user
  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await getUser();
      return res;
    }
  });

  // Effect to check ownership
  useEffect(() => {
    if (userQuery.isLoading) return;

    // Consider admin users to always have access
    if (userQuery.data?.type === 'Admin') {
      setHasAccess(true);
      setIsChecking(false);
      return;
    }

    // Check if user is the owner
    const isOwner = userQuery.data?.id === ownerId;
    setHasAccess(isOwner);
    setIsChecking(false);

    // Handle auto-redirect
    if (autoRedirect && !isOwner) {
      const timer = setTimeout(() => {
        router.push(redirectPath);
      }, redirectDelay);

      return () => clearTimeout(timer);
    }
  }, [userQuery.data, ownerId, autoRedirect, redirectPath, redirectDelay, router]);

  // Loading state
  if (isChecking || userQuery.isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return accessDeniedComponent || (
      <div className='w-full h-full flex items-center justify-center'>
        <Card className="w-full max-w-md mx-auto my-8">
          <CardHeader>
            <CardTitle className="text-center text-destructive flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              {errorMessage}
            </p>
            {autoRedirect && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Redirecting to dashboard in {Math.round(redirectDelay / 1000)} seconds...
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="default"
              onClick={() => router.push(redirectPath)}
            >
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Access granted
  return <>{children}</>;
}