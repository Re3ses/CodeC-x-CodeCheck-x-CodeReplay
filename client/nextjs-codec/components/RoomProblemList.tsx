import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { SubmissionSchemaInferredType } from '@/lib/interface/submissions';
import { ProblemSchemaInferredType } from '@/lib/interface/problem';
import { RoomSchemaInferredType } from '@/lib/interface/room';
import { GetRoom } from '@/utilities/apiService';
import { getUser } from '@/lib/auth';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import SafeHtml from './SafeHtml';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { UpdateProblemDialog } from './ui/classroom/updateProblemDialog';
import { MoreVertical, Eye, CopyCheck, Trash2, Code, ChevronDown, ChevronRight, FileText, CheckCircle2, Pencil } from 'lucide-react';

const CollapsibleDescription = ({ description }: { description: string }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-1 h-fit">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        Description {isExpanded ?
          <ChevronRight className="h-4 w-4" /> :
          <ChevronDown className="h-4 w-4" />
        }
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96' : 'max-h-0'
          }`}
      >
        <SafeHtml html={description || "No description provided."} />
      </div>
    </div>
  );
};


export default function RoomProblemList({ params }: { params: { slug: string } }) {
  const roomQuery = useQuery<RoomSchemaInferredType>({
    queryKey: ['room', params.slug],
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

  const isMentor = userQuery.data?.type === 'Mentor';

  const submissionsQuery = useQuery<SubmissionSchemaInferredType[]>({
    queryKey: ['submissions', params.slug, userQuery.data?.id],
    queryFn: async () => {
      // Make sure we're passing the proper user ID
      if (!userQuery.data?.id) {
        return [];
      }
      const response = await fetch(`/api/userSubmissions?room_id=${params.slug}&learner_id=${userQuery.data?.id}&highestPerProblem=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      const data = await response.json();
      return data.submissions || [];
    },
    enabled: !!userQuery.data && !!roomQuery.data && !isMentor
  });

  // useEffect(() => {
  //   console.log("Submissions Data:", submissionsQuery.data);
  //   console.log("Submissions Query:", submissionsQuery);
  // }, [submissionsQuery]);

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

  const getSubmission = (problemSlug: string) => {
    if (!submissionsQuery.data || !problemSlug) return null;
    return submissionsQuery.data.find(sub => sub.problem === problemSlug);
  };


  return (
    <div className="space-y-4">
      {roomQuery.data ? (
        roomQuery.data.problems.map((problem: ProblemSchemaInferredType, index: number) => {
          // Get submission for this specific problem
          const submission = getSubmission(problem.slug);

          return (
            <Card key={index}>
              <CardHeader className="">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-bold">{problem.name}</CardTitle>
                    <CollapsibleDescription description={problem.description} />
                  </div>
                  {isMentor ? (
                    <div className="flex items-center justify-center gap-2 shrink-0">
                      <div className='grid grid-cols-2 gap-2'>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/submissions/${params.slug}?problem=${problem.slug}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Submissions
                          </Link>
                        </Button>
                        <Button variant="codecBlue" size="sm">
                          <Link href={`/codeHistory/problem/${problem.slug}`} className='flex items-center'>
                            <CopyCheck className="mr-2 h-4 w-4" />
                            CodeCheck
                          </Link>
                        </Button>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-muted-foreground focus:text-primary"
                          >
                            <Link className="flex items-center text-white" href={`/mentor/coderoom/r/${params.slug}/problem/${problem.slug}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>

                          <UpdateProblemDialog
                            problem={{
                              _id: problem._id!,
                              name: problem.name,
                              description: problem.description,
                              input_format: problem.input_format || "",
                              output_format: problem.output_format || "",
                              constraints: problem.constraints || "",
                              languages: problem.languages || [],
                              test_cases: problem.test_cases || [],
                              mentor: problem.mentor || "",
                              perfect_score: problem.perfect_score || 0
                            }}
                            onSuccess={() => {
                              // Refetch room data to get updated problems
                              roomQuery.refetch();
                            }}
                          />

                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-white focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Problem</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete &quot;{problem.name}&quot;? This action cannot be undone.
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {submission && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">
                            Score: {submission.score || 0}/{problem.perfect_score}
                          </span>
                          {submission.score >= problem.perfect_score && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      )}
                      <Button asChild>
                        <Link href={`/learner/coderoom/r/${params.slug}/problem/${problem.slug}`}>
                          <Code className="mr-2 h-4 w-4" />
                          Solve Problem
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>
          );
        })
      ) : (
        <div className="text-center text-muted-foreground">
          Loading problems...
        </div>
      )}
      {roomQuery.data && roomQuery.data.problems.length === 0 && (
        <div className="text-center text-muted-foreground">
          No problems available for this room.
        </div>
      )}
    </div>
  );
}