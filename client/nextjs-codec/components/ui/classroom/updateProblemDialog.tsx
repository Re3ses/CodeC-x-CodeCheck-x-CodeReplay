'use client';

import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import UpdateProblemForm from './updateProblemForm';

interface ProblemData {
  _id: string;
  name: string;
  description: string;
  input_format: string;
  output_format: string;
  constraints: string;
  languages: Array<{
    name: string;
    code_snippet: any;
    time_complexity: number;
    space_complexity: number;
  }>;
  test_cases: Array<{
    is_eval: boolean;
    input: string;
    output: string;
    is_sample: boolean;
    score: number;
  }>;
  mentor: string;
  perfect_score: number;
}

interface UpdateProblemDialogProps {
  problem: ProblemData;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function UpdateProblemDialog({ problem, onSuccess, trigger }: UpdateProblemDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Problem
          </DropdownMenuItem>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Problem</DialogTitle>
          <DialogDescription>
            Make changes to your problem settings and configurations
          </DialogDescription>
        </DialogHeader>

        <UpdateProblemForm
          problem={problem}
          onFormSubmit={(success: (any)) => {
            if (success) {
              onSuccess();
              closeRef.current?.click();
            }
          }}
        />

        <DialogClose ref={closeRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}