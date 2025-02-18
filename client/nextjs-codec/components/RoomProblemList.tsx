import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ProblemSchemaInferredType } from '@/lib/interface/problem';
import { RoomSchemaInferredType } from '@/lib/interface/room';
import { GetRoom } from '@/utilities/apiService';
import { getUser } from '@/lib/auth';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Eye, CopyCheck, History, Trash2, Code, ChevronDown, ChevronUp, FileText } from 'lucide-react';

const CollapsibleDescription = ({ description }: { description: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        Description {isExpanded ? 
          <ChevronUp className="h-4 w-4" /> : 
          <ChevronDown className="h-4 w-4" />
        }
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-24' : 'max-h-0'
        }`}
      >
        <p className="text-sm text-muted-foreground pt-2">
          {description || "No description provided"}
        </p>
      </div>
    </div>
  );
};

export default function RoomProblemList({ params }: { params: { slug: string } }) {
  const pathname = usePathname();
  const router = useRouter();

  const roomQuery = useQuery<RoomSchemaInferredType>({
    queryKey: ['room'],
    queryFn: async () => {
      const res = await GetRoom(params.slug!);
      return res;
    },
  });

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await getUser();
      return res;
    },
  });

  const handleDelete = async (problemId: string, problemName: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}${process.env.NEXT_PUBLIC_SERVER_PORT}/api/problems?problem_id=${problemId}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        toast({
          title: "Problem Deleted",
          description: `"${problemName}" has been successfully deleted.`,
        });
        location.reload();
      } else {
        throw new Error('Failed to delete problem');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the problem. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isMentor = userQuery.data?.type === 'Mentor';

  return (
    <div className="space-y-4">
      {roomQuery.data?.problems.map((problem: ProblemSchemaInferredType, index: number) => (
        <Card key={index}>
          <CardHeader className="">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold">{problem.name}</CardTitle>
                <CollapsibleDescription description={problem.description} />
              </div>
              {isMentor ? (
                <div className="grid grid-cols-2 gap-2 shrink-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/mentor/coderoom/r/${params.slug}/problem/${problem.slug}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/codeHistory/problem/${problem.slug}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Submissions 
                    </Link>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CopyCheck className="mr-2 h-4 w-4" />
                        CodeCheck
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Choose Comparison Type</DialogTitle>
                        <DialogDescription>
                          Select the type of comparison analysis you want to view.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 gap-2">
                        <Button variant="outline" asChild>
                          <Link href={`/comparisons/problem/${problem.slug}/default`}>
                            Default Comparison
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`/comparisons/problem/${problem.slug}/tree_no_preproc`}>
                            Tree-sitter Analysis
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`/comparisons/problem/${problem.slug}/tree_preproc`}>
                            Tree-sitter with Preprocessing
                          </Link>
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Problem</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete "{problem.name}"? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button 
                            variant="destructive" 
                            onClick={() => handleDelete(problem._id!, problem.name)}
                          >
                            Delete Problem
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <Button asChild>
                  <Link href={`/learner/coderoom/r/${params.slug}/problem/${problem.slug}`}>
                    <Code className="mr-2 h-4 w-4" />
                    Solve Problem
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}