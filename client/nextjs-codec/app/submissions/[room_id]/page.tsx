'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Code, X, Trophy, AlertTriangle } from 'lucide-react';
import moment from 'moment';
import Nav from '@/app/dashboard/nav';
import { useParams, useSearchParams } from 'next/navigation';
import { ProblemSchemaInferredType } from '@/lib/interface/problem';
import { RoomSchemaInferredType } from '@/lib/interface/room'; // Import the RoomSchemaInferredType
import { useQuery } from '@tanstack/react-query';
import { GetRoom } from '@/utilities/apiService';

interface Submission {
  _id: string;
  language_used: string;
  code: string;
  score: number;
  score_overall_count: number;
  verdict: string;
  learner: string;
  learner_id: string;
  problem: string;
  room: string;
  completion_time: number;
  submission_date: string;
  attempt_count: number;
}

export default function SubmissionsPage() {
  const { room_id } = useParams();
  const searchParams = useSearchParams();
  const problemSlug = searchParams.get('problem');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [problemData, setProblemData] = useState<ProblemSchemaInferredType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use useQuery to fetch room data
  const roomQuery = useQuery<RoomSchemaInferredType>({
    queryKey: ['room', room_id],
    queryFn: async () => {
      const res = await GetRoom(room_id as string);
      return res;
    },
    enabled: !!room_id, // Only fetch if room_id is available
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!problemSlug || !room_id) {
          throw new Error('Problem ID and Room ID are required');
        }

        // Fetch submissions first
        const submissionsResponse = await fetch(
          `/api/userSubmissions?room_id=${room_id}&problem=${problemSlug}`,
          {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (!submissionsResponse.ok) {
          throw new Error('Failed to fetch submissions data');
        }

        const submissionsData = await submissionsResponse.json();

        if (!submissionsData.success) {
          throw new Error(submissionsData.error || 'Failed to fetch submissions data');
        }

        // Process submissions regardless of problem data availability
        const highestSubmissions = submissionsData.submissions.reduce((acc: Record<string, Submission>, curr: Submission) => {
          if (!acc[curr.learner_id] || acc[curr.learner_id].score_overall_count < curr.score_overall_count) {
            acc[curr.learner_id] = curr;
          }
          return acc;
        }, {});

        setSubmissions(Object.values(highestSubmissions));

        // Try to fetch problem data with the new API structure
        try {
          const problemResponse = await fetch(`api/problems?problem_id=${problemSlug}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!problemResponse.ok) {
            throw new Error(`Problem data not available: ${problemResponse.statusText}`);
          }

          const problemData = await problemResponse.json();
          if (!problemData) {
            throw new Error('Problem data is empty');
          }

          setProblemData(problemData);
        } catch (problemError) {
          console.warn('Failed to fetch problem data:', problemError);
          // Don't set error state for problem data failure, just log it
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (room_id && problemSlug) {
      fetchData();
    }
  }, [room_id, problemSlug]);

  const filteredSubmissions = submissions.filter(submission =>
    submission.learner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    // Use the perfect score from the problem data (or room data) as the denominator
    const perfectScore = problemData?.perfect_score || roomQuery.data?.problems.find((p) => p.slug === problemSlug)?.perfect_score || 100;
  
    // Calculate the percentage based on the perfect score
    const percentage = (score / perfectScore) * 100;
  
    // Determine the color based on the percentage
    if (percentage >= 80) return 'bg-green-500/20 text-green-400';
    if (percentage >= 50) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl text-white mb-2">Problem Submissions</CardTitle>
                <div className="flex items-center gap-2">
                  {roomQuery.data?.problems.map((problem: ProblemSchemaInferredType, index: number) => (
                    problem.slug === problemSlug && (
                      <React.Fragment key={problem._id}>
                        <Trophy className="h-5 w-5 text-yellow-400" />
                        <CardDescription className="text-gray-400">
                          Perfect Score: <span className="text-yellow-400 font-semibold">{problem.perfect_score} points</span>
                        </CardDescription>
                      </React.Fragment>
                    )
                  ))}
                  {!roomQuery.data?.problems.some((problem: ProblemSchemaInferredType) => problem.slug === problemSlug) && (
                    <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Problem details unavailable</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
                <Input
                  placeholder="Search by student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full bg-gray-900/50 border-gray-700 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center items-center py-12"
                >
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                </motion.div>
              ) : error ? (
                <div className="text-red-400 text-center py-4">{error}</div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="text-gray-400 text-center py-4">
                  No submissions found
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-gray-900 border-gray-700">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700 hover:bg-gray-800/50">
                          <TableHead className="w-[250px] font-semibold text-gray-300">Name</TableHead>
                          <TableHead className="font-semibold text-gray-300">Duration</TableHead>
                          <TableHead className="font-semibold text-gray-300">Attempts</TableHead>
                          <TableHead className="font-semibold text-gray-300">Score</TableHead>
                          <TableHead className="text-right font-semibold text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubmissions.map((submission) => (
                          <React.Fragment key={submission._id}>
                            <TableRow className="group border-gray-700 hover:bg-gray-800/50">
                              <TableCell className="font-medium text-white">
                                {submission.learner}
                              </TableCell>
                              <TableCell className="text-gray-400">
                                {moment.duration(submission.completion_time).humanize()}
                              </TableCell>
                              <TableCell className="text-gray-400">
                                {submission.attempt_count}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={`font-mono ${getScoreColor(submission.score_overall_count)}`}
                                >
                                  {submission.score_overall_count}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity border-gray-700 hover:bg-gray-700"
                                  onClick={() => setSelectedSubmissionId(
                                    selectedSubmissionId === submission._id ? null : submission._id
                                  )}
                                >
                                  {selectedSubmissionId === submission._id ? (
                                    <>
                                      <X className="mr-2 h-4 w-4" />
                                      Hide Code
                                    </>
                                  ) : (
                                    <>
                                      <Code className="mr-2 h-4 w-4" />
                                      View Code
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                            <AnimatePresence>
                              {selectedSubmissionId === submission._id && (
                                <motion.tr
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <td colSpan={5} className="p-0">
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="border-t border-gray-700 bg-gray-900"
                                    >
                                      <div className="h-96">
                                        <Editor
                                          height="100%"
                                          defaultLanguage={submission.language_used}
                                          defaultValue={submission.code}
                                          theme="vs-dark"
                                          options={{
                                            readOnly: true,
                                            minimap: { enabled: false },
                                            scrollBeyondLastLine: false,
                                            fontSize: 14,
                                          }}
                                        />
                                      </div>
                                    </motion.div>
                                  </td>
                                </motion.tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}