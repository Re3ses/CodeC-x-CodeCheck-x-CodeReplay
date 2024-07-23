'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Select } from '@radix-ui/react-select';
import { Suspense, useState } from 'react';
import LeaderboardTable from './leaderboardTable';

export default function LeaderboardsPage() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <LeaderboardTable />
    </div>
  );
}
