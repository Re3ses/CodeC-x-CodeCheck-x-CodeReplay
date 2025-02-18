'use client';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function PathIndicator() {
  const pathname = usePathname();
  const formatted = pathname.split('/');
  console.log(formatted);
  return (
    <div className="p-2">
      {formatted.map((word: string, index: number) => {
        if (index !== formatted.length - 1 && index !== 0) {
          return (
            <>
              {word} {'>'}{' '}
            </>
          );
        } else {
          return <> {word}</>;
        }
      })}
    </div>
  );
}
