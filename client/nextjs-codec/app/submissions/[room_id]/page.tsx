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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, Code, X, Trophy, AlertTriangle, Filter, ChevronDown, ChevronUp, ArrowDownNarrowWide, ArrowUpNarrowWide } from 'lucide-react';
import moment from 'moment';
import Nav from '@/app/dashboard/nav';
import { useParams, useSearchParams } from 'next/navigation';
import { ProblemSchemaInferredType } from '@/lib/interface/problem';
import { RoomSchemaInferredType } from '@/lib/interface/room'; // Import the RoomSchemaInferredType
import { useQuery } from '@tanstack/react-query';
import { GetRoom } from '@/utilities/apiService';
import Loading from '@/components/loading';
import { get } from 'lodash';

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
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [problemData, setProblemData] = useState<ProblemSchemaInferredType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minScore: 0,
    maxAttempts: 100,
    sortBy: 'score', // 'score', 'name', 'attempts', 'duration'
    sortOrder: 'desc', // 'asc', 'desc'
    showHighestOnly: true,
  });

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

        // Store all submissions
        setAllSubmissions(submissionsData.submissions);

        // Process submissions
        const highestSubmissions = submissionsData.submissions.reduce((acc: Record<string, Submission>, curr: Submission) => {
          if (!acc[curr.learner_id] || acc[curr.learner_id].score_overall_count < curr.score_overall_count) {
            acc[curr.learner_id] = curr;
          }
          return acc;
        }, {});

        setSubmissions(Object.values(highestSubmissions));

        // Try to fetch problem data with the new API structure
        try {
          const problemResponse = await fetch(`/api/problems?problem_id=${problemSlug}`, {
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

  // Apply filters function
  useEffect(() => {
    if (allSubmissions.length === 0) return;

    let filtered = [...allSubmissions];

    // Apply highest score only filter
    if (filters.showHighestOnly) {
      const highestSubmissions = filtered.reduce((acc: Record<string, Submission>, curr: Submission) => {
        if (!acc[curr.learner_id] || acc[curr.learner_id].score_overall_count < curr.score_overall_count) {
          acc[curr.learner_id] = curr;
        }
        return acc;
      }, {});
      filtered = Object.values(highestSubmissions);
    }

    // Apply score filter
    filtered = filtered.filter(submission =>
      submission.score_overall_count >= filters.minScore
    );

    // Apply attempts filter
    filtered = filtered.filter(submission =>
      submission.attempt_count <= filters.maxAttempts
    );

    // Apply search filter
    filtered = filtered.filter(submission =>
      submission.learner.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'score':
          comparison = a.score_overall_count - b.score_overall_count;
          break;
        case 'name':
          comparison = a.learner.localeCompare(b.learner);
          break;
        case 'attempts':
          comparison = a.attempt_count - b.attempt_count;
          break;
        case 'duration':
          comparison = a.completion_time - b.completion_time;
          break;
        default:
          comparison = 0;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    setSubmissions(filtered);
  }, [allSubmissions, filters, searchQuery]);

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

  const getLanguageUsed = (language: string) => {
    switch (language) {
      case '54':
        return 'c++';
      case '62':
        return 'java';
      case '71':
        return 'python';
      case '50':
        return 'c';
      case '88':
        return 'c#';
      case '63':
        return 'javaScript';
      default:
        return 'plaintext';
    }
  }



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

            {/* Filter button */}
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full sm:w-auto flex items-center justify-center border-gray-700 hover:bg-gray-700 text-gray-300"
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                {showFilters ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
              </Button>

              {/* Filter panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 bg-gray-900/50 rounded-lg p-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Minimum Score */}
                      <div className="space-y-2">
                        <Label className="text-gray-300">Minimum Score</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="range"
                            min="0"
                            max={problemData?.perfect_score || 100}
                            value={filters.minScore}
                            onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
                            className="w-full"
                          />
                          <Input
                            type="number"
                            min="0"
                            max={problemData?.perfect_score || 100}
                            value={filters.minScore}
                            onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
                            className="w-20 bg-gray-800 border-gray-700 text-gray-300"
                          />
                        </div>
                      </div>

                      {/* Max Attempts */}
                      <div className="space-y-2">
                        <Label className="text-gray-300">Max Attempts</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="range"
                            min="1"
                            max="100"
                            value={filters.maxAttempts}
                            onChange={(e) => setFilters({ ...filters, maxAttempts: parseInt(e.target.value) })}
                            className="w-full"
                          />
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={filters.maxAttempts}
                            onChange={(e) => setFilters({ ...filters, maxAttempts: parseInt(e.target.value) })}
                            className="w-20 bg-gray-800 border-gray-700 text-gray-300"
                          />
                        </div>
                      </div>


                      {/* Show only highest score */}
                      <div className="space-y-2">
                        <Label className="text-gray-300">Display Options</Label>
                        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-md border border-gray-700">
                          <span className="text-gray-300 text-sm">Show only highest score per student</span>
                          <Switch
                            checked={filters.showHighestOnly}
                            onCheckedChange={(checked) => setFilters({ ...filters, showHighestOnly: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {isLoading ? (
                <Loading message="Loading submissions..." />
              ) : error ? (
                <div className="text-red-400 text-center py-4">{error}</div>
              ) : submissions.length === 0 ? (
                <div className="text-gray-400 text-center py-4">
                  No submissions found
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Table display */}
                  <Card className="bg-gray-900 border-gray-700">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700 hover:bg-gray-800/50">
                          <TableHead className="w-[250px] font-semibold text-gray-300">
                            <Button
                              onClick={() => setFilters({ ...filters, sortBy: 'name', sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                              variant="ghost"
                              className="flex items-center gap-2 text-gray-300 hover:text-white">
                              Name
                              {filters.sortBy === 'name' && (filters.sortOrder === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4" /> : <ArrowDownNarrowWide className="h-4 w-4" />)}
                            </Button>
                          </TableHead>
                          <TableHead className="font-semibold text-gray-300">
                            <Button
                              onClick={() => setFilters({ ...filters, sortBy: 'duration', sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                              variant="ghost"
                              className="flex items-center gap-2 text-gray-300 hover:text-white">
                              Duration
                              {filters.sortBy === 'duration' && (filters.sortOrder === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4" /> : <ArrowDownNarrowWide className="h-4 w-4" />)}
                            </Button>
                          </TableHead>
                          <TableHead className="font-semibold text-gray-300">
                            <Button
                              onClick={() => setFilters({ ...filters, sortBy: 'attempts', sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                              variant="ghost"
                              className="flex items-center gap-2 text-gray-300 hover:text-white">
                              Attempts
                              {filters.sortBy === 'attempts' && (filters.sortOrder === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4" /> : <ArrowDownNarrowWide className="h-4 w-4" />)}
                            </Button>
                          </TableHead>
                          <TableHead className="font-semibold text-gray-300">
                            <Button
                              onClick={() => setFilters({ ...filters, sortBy: 'score', sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                              variant="ghost"
                              className="flex items-center gap-2 text-gray-300 hover:text-white">
                              Score
                              {filters.sortBy === 'score' && (filters.sortOrder === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4" /> : <ArrowDownNarrowWide className="h-4 w-4" />)}
                            </Button>
                          </TableHead>
                          <TableHead className="text-right font-semibold text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Existing table body code */}
                        {submissions.map((submission) => (
                          <React.Fragment key={submission._id}>
                            <TableRow className="group border-gray-700 hover:bg-gray-800/50">
                              <TableCell className="pl-8 font-medium text-white">
                                {submission.learner}
                              </TableCell>
                              <TableCell className="pl-8 text-gray-400">
                                {moment.duration(submission.completion_time).humanize()}
                              </TableCell>
                              <TableCell className="pl-8 text-gray-400">
                                {submission.attempt_count}
                              </TableCell>
                              <TableCell className='pl-8'>
                                <Badge
                                  variant="outline"
                                  className={`font-mono ${getScoreColor(submission.score_overall_count)} `}
                                >
                                  {submission.score_overall_count}
                                </Badge>
                              </TableCell>
                              <TableCell className="pl-8 text-right">
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
                                          defaultLanguage={getLanguageUsed(submission.language_used)}
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