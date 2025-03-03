'use client';

import { useEffect } from 'react';
import HttpError from '@/components/ui/HttpError';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <HttpError statusCode={500} reset={reset} />;
}