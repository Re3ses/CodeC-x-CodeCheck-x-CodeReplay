import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import React from 'react';
import { buttonVariants } from '@/components/ui/button';

export default function Modal({
  children,
  label,
  title,
  description,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  label: string | React.ReactNode;
  title?: string | null;
  description?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <div className={buttonVariants({ variant: 'default' })}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger>{label}</DialogTrigger>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </div>
  );
}