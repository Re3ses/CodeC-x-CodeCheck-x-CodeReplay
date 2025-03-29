//page.tsx
'use client'
import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, FileCode2, Network, GitBranch, Activity } from "lucide-react";
import SimilarityLoading from './SimilarityLoading';
import SimilarityDashboard from './SimilarityMatrix';
import SequentialSimilarityVisualization from '@/components/SequentialSimilarityVisualization';
import { useParams } from 'next/navigation';

interface CodeSnapshot {
  code: string;
  timestamp: string;
  learner_id: string;
  problemId?: string;
  roomId?: string;
  submissionId?: string;
  version?: number;
}

interface EnhancedPasteInfo {
  learner_id: string;
  text: string;
  fullCode: string;
  timestamp: string;
  length: number;
  contextRange: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

interface SimilarSnippet {
  learner_id: string;
  similarity: number;
  codebertScore: number;
  timestamp: string;
  code: string;
  fileName: string;
  clusterId?: number;
  isLikelySource?: boolean;
}

interface SnippetInfo {
  learner: string;
  learner_id: string;
  code: string;
  timestamp: string;
  fileName: string;
}
// interface AdvancedMetrics {
//   maxChange: number;
//   averageSimilarity: number;
//   minSimilarity: number;
//   normalizedVariance: number;
//   weightedPlagiarismScore: number;
//   pasteCount: number;
//   bigPasteCount: number;
// }

export default function CodeReplayApp() {
  const params = useParams<{ type: string, id: string }>();
  const [similarityMatrix, setSimilarityMatrix] = useState<{
    matrix: number[][];
    snippets: SnippetInfo[];
  } | null>(null);
  const [isMatrixLoading, setIsMatrixLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<CodeSnapshot[]>([]);
  const [enhancedPastes, setEnhancedPastes] = useState<EnhancedPasteInfo[]>([]);
  const [filters, setFilters] = useState({
    verdict: '',
    problemId: params.type === 'problem' ? params.id : '',
    roomId: params.type === 'room' ? params.id : '',
    acceptPartialSubmissions: false,
    userType: '',
    highestScoringOnly: false
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, type, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };


  // Fetch user submissions
  useEffect(() => {
    const fetchUserSubmissions = async () => {
      try {
        const response = await fetch(
          `/api/userSubmissions/?problem_slug=${params.id}`
        );

        const data = await response.json();
        // console.log("user submissions", data);

        // Ensure that 'submissions' exists before calling map
        const enhancedPastes = data.submissions?.map((submission: any) => {
          const pasteHistory = JSON.parse(submission.paste_history);
          return pasteHistory.map((paste: any) => ({
            text: paste.text,
            fullCode: paste.fullCode,
            timestamp: paste.timestamp,
            length: paste.length,
            contextRange: paste.contextRange,
            learner_id: submission.learner_id
          }));
        }).flat();

        // // If no submissions are found, enhancedPastes will be an empty array
        // console.log("enhanced pastes", enhancedPastes);
        setEnhancedPastes(enhancedPastes);

      } catch (error) {
        console.error('Error fetching user submissions:', error);
      }
    };

    fetchUserSubmissions();
  }, [params.type, params.id]);

  // fetch snapshots
  useEffect(() => {
    const fetchLearnerSnapshots = async () => {
      try {
        const response = await fetch(
          `/api/codereplay/code-snapshots?problem_id=${params.id}`
        );
        const data = await response.json();
        // console.log("Data received from code-snapshots API:", data);

        if (data.success) {
          // console.log("snapshots successfuly fetched", data.success, data.snapshots);
          const sortedSnapshots = data.snapshots.sort((a: CodeSnapshot, b: CodeSnapshot) => {
            if (a.version && b.version) {
              return a.version - b.version;
            }
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          });

          // console.log("sorted snapshots", sortedSnapshots);

          setSnapshots(sortedSnapshots);
        }
      } catch (error) {
        console.error('Error fetching learner snapshots:', error);
      }
    };
    fetchLearnerSnapshots();
  }, []);

  const fetchSimilarityData = async (filterOptions = filters) => {
    try {
      setIsMatrixLoading(true);

      const queryParams = new URLSearchParams({
        ...(filterOptions.verdict && { verdict: filterOptions.verdict }),
        ...(filterOptions.problemId && { problemId: filterOptions.problemId }),
        ...(filterOptions.roomId && { roomId: filterOptions.roomId }),
        ...(filterOptions.acceptPartialSubmissions && { acceptPartialSubmissions: filterOptions.acceptPartialSubmissions.toString() }),
        ...(filterOptions.userType && { userType: filterOptions.userType }),
        ...(filterOptions.highestScoringOnly && { highestScoringOnly: filterOptions.highestScoringOnly.toString() })
      }).toString();

      // console.log("Query params", queryParams);

      const API_URL = process.env.FLASK_API_URL || 'https://codecflaskapi.duckdns.org';
      // const API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/similarity/matrix?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setSimilarityMatrix({
          matrix: data.matrix,
          snippets: data.snippets
        });
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsMatrixLoading(false);
    }
  };

  useEffect(() => {
    fetchSimilarityData();
  }, []);

  // Calculate statistics for each snippet
  const calculateSnippetStats = (matrix: number[][], index: number) => {
    if (!matrix || !matrix[index]) return null;

    const similarities = matrix[index].filter((_, i) => i !== index);
    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    const maxSimilarity = Math.max(...similarities);

    // Find highly similar snippets (>= 60%)
    const similarSnippets = similarities
      .map((similarity, i) => ({ index: i, similarity }))
      .filter(item => item.similarity >= 60 && item.index !== index)
      .sort((a, b) => b.similarity - a.similarity);

    return {
      averageSimilarity: avgSimilarity,
      maxSimilarity,
      similarSnippets
    };
  };

  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-yellow-500" />
          CodeCheck
        </h1>
        <Tabs defaultValue="network" className="w-full">
          <TabsList className="bg-gray-800 border-b border-gray-700">
            <TabsTrigger value="network" className="data-[state=activ
            e]:bg-gray-700">
              <Network className="w-4 h-4 mr-2 text-yellow-500" />
              Similarity Network
            </TabsTrigger>
            <TabsTrigger value="evolution" className="data-[state=active]:bg-gray-700">
              <GitBranch className="w-4 h-4 mr-2 text-yellow-500" />
              Code Evolution
            </TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="mt-6">
            {isMatrixLoading ? (
              <SimilarityLoading />
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-bold mb-2">Filters</h3>
                  <div className="grid grid-cols-3 gap-4 items-center justify-center">
                    <div className="col-span-1">
                      <label className="text-sm text-gray-300">Verdict:</label>
                      <select name="verdict" value={filters.verdict} onChange={handleFilterChange} className="w-full p-2 bg-gray-900 border border-gray-700 rounded">
                        <option value="">All</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                      </select>

                      <label className="flex items-center space-x-2 text-gray-300">
                        <input
                          type="checkbox"
                          name="acceptPartialSubmissions"
                          checked={filters.acceptPartialSubmissions}
                          onChange={handleFilterChange}
                          className="w-4 h-4"
                          title="This option overrides the verdict filter and includes all submissions with a score greater than 0."
                        />
                        <span>Accept Partial Submissions</span>
                      </label>

                    </div>

                    <div className="col-span-1">
                      <label className="text-sm text-gray-300">User Type:</label>
                      <select name="userType" value={filters.userType} onChange={handleFilterChange} className="w-full p-2 bg-gray-900 border border-gray-700 rounded">
                        <option value="Learner">Learners</option>
                        <option value="Mentor">Mentors</option>
                        <option value="All">All</option>
                      </select>

                      <label className="flex items-center space-x-2 text-gray-300">
                        <input
                          type="checkbox"
                          name="highestScoringOnly"
                          checked={filters.highestScoringOnly}
                          onChange={handleFilterChange}
                          className="w-4 h-4"
                          title="This option overrides the 'Accept Partial Submissions' filter and includes only the highest scoring submission for each learner."
                        />
                        <span>Filter Highest Scoring Only</span>
                      </label>
                    </div>

                    <div className="col-span-1">
                      <button onClick={() => fetchSimilarityData(filters)} className="w-full bg-yellow-500 text-black p-2 rounded">
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>

                {similarityMatrix ?
                  <SimilarityDashboard
                    matrix={similarityMatrix.matrix}
                    snippets={similarityMatrix.snippets}
                  /> : "similaritymatrix empty"
                }
              </div>
            )}
          </TabsContent>

          <TabsContent value="evolution" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative">
              {
                similarityMatrix?.snippets
                  .filter((snippet, index, self) =>
                    index === self.findIndex((s) => s.learner_id === snippet.learner_id)
                  )
                  .map((snippet, index) => (
                    <div key={index} className={`${expandedCard === index ? 'col-span-full row-span-2' : ''} transition-all duration-300`}>
                      <Card className="bg-gray-800/50 border-0 shadow-lg h-full">
                        <CardHeader
                          className="cursor-pointer p-4"
                          onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                        >
                          <CardTitle className="text-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 truncate">
                                <FileCode2 className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{snippet.learner}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {expandedCard === index ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        {expandedCard === index && (
                          <CardContent className="p-4">
                            <SequentialSimilarityVisualization
                              snapshots={snapshots.filter(s => s.learner_id === snippet.learner_id)}
                              learnerId={snippet.learner_id}
                              pastedSnippets={enhancedPastes.filter(s => s.learner_id === snippet.learner_id)}
                            />
                          </CardContent>
                        )}
                      </Card>
                    </div>
                  ))
              }
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
