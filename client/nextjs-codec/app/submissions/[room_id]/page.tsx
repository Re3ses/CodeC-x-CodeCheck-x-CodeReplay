'use client';

// Add this import at the top
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
import { Search, CheckCircle2, Code, AlertCircle, X } from 'lucide-react';
import moment from 'moment';
import Nav from '@/app/dashboard/nav';
import { useParams, useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { SubmissionSchemaInferredType } from '@/lib/interface/submissions';

export default function Page() {
  const router = useRouter();
  const { room_id } = useParams();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<SubmissionSchemaInferredType>([]);
  interface User {
    type: string;
    auth: {
      username: string;
    };
  }

  const [user, setUser] = useState<User | null>(null);

  // Mock data for demonstration
  const mockSubmissions = {
    submission: [
      {
        _id: '1',
        learner: 'John Doe',
        completion_time: 3600000,
        score: 10,
        score_overall_count: 10,
        verdict: 'ACCEPTED',
        code: 'function example() {\n  return "Hello World";\n}',
        language: 'javascript'
      },
      {
        _id: '2',
        learner: 'Jane Smith',
        completion_time: 2800000,
        score: 8,
        score_overall_count: 10,
        verdict: 'ACCEPTED',
        code: 'def example():\n    return "Hello World"',
        language: 'python'
      },
      {
        _id: '3',
        learner: 'Mike Johnson',
        completion_time: 4200000,
        score: 6,
        score_overall_count: 10,
        verdict: 'REJECTED',
        code: 'public class Example {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
        language: 'java'
      }
    ]
  };

  useEffect(() => {
    const req = async () => {
      try {
        setIsLoading(true);
        const val = await getUser();
        setUser(val);
        if (val.error || val.message === 'Authentication failed: [JWT MALFORMED]') {
          router.push('/login');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    // Uncomment this block to fetch proper data, not mock data
    // Fetch room data 
    const fetchData = async () => {
      await fetch(`/api/userSubmissions?room_id=${room_id}`).then(
        async (val) => {
          await val.json().then((data) => {
            setSubmissions(data);
          });
        }
      );
    };

    fetchData();

    req();
  }, [room_id, router]);

  const highestScores = submissions.reduce((acc: any, curr: any) => {
    if (!acc[curr.learner] || acc[curr.learner].score < curr.score) {
      acc[curr.learner] = curr;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-900">
      <Nav type={user?.type} name={user?.auth?.username} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl text-white">Problem Submissions</CardTitle>
                <CardDescription className="text-gray-400">
                  Showing highest scores per student
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
                <Input
                  placeholder="Search by student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full bg-gray-900/50 border-gray-700"
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
                          <TableHead className="font-semibold text-gray-300">Score</TableHead>
                          <TableHead className="font-semibold text-gray-300">Status</TableHead>
                          <TableHead className="text-right font-semibold text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.values(highestScores).map((submission) => (
                          <React.Fragment key={submission._id}>
                            <TableRow className="group border-gray-700 hover:bg-gray-800/50">
                              <TableCell className="font-medium text-white">
                                {submission.learner}
                              </TableCell>
                              <TableCell className="text-gray-400">
                                {moment.duration(submission.completion_time).humanize()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono bg-gray-900/50">
                                  {submission.score} / {submission.score_overall_count}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {submission.score === submission.score_overall_count ? (
                                  <Badge className="bg-green-900/30 text-green-300 border-green-500/20">
                                    <CheckCircle2 className="mr-1 h-4 w-4" />
                                    Perfect Score
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant={submission.verdict === 'ACCEPTED' ? 'default' : 'destructive'}
                                    className="items-center"
                                  >
                                    {submission.verdict === 'ACCEPTED' ? (
                                      <CheckCircle2 className="mr-1 h-4 w-4" />
                                    ) : (
                                      <AlertCircle className="mr-1 h-4 w-4" />
                                    )}
                                    {submission.verdict}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity border-gray-700"
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
                                          defaultLanguage={submission.language}
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