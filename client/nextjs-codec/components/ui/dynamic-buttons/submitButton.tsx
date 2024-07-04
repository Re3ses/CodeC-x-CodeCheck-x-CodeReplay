'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({ message }: { message: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="border" type="submit" disabled={pending}>
      {pending ? 'Processing...' : `${message}`}
    </button>
  );
}
