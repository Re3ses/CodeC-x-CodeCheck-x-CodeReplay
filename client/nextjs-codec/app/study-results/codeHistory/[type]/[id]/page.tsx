'use client'
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, FileCode2, Network, GitBranch, Activity } from "lucide-react";
import Loading from '@/components/loading';
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

const studyProblems = [
  "box-formatter-4312784064",
  "fahrenheit-to-celsius-converter-8133077604",
  "count-vowels-in-a-string-7746433050",
  "palindrome-check-6834925212",
  "character-inspector-4333782441",
  "perfectly-rooted-5136456806",
  "linear-search-for-odd-numbers-4386603267"
]

export default function CodeReplayApp() {
  const params = useParams<{ type: string, id: string }>();
  const [similarityMatrix, setSimilarityMatrix] = useState<{
    matrix: number[][];
    snippets: SnippetInfo[];
  } | null>(null);
  const [isMatrixLoading, setIsMatrixLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<CodeSnapshot[]>([]);
  const [enhancedPastes, setEnhancedPastes] = useState<EnhancedPasteInfo[]>([]);
  const [anonymize, setAnonymize] = useState(true);

  // Fetch user submissions
  useEffect(() => {
    const fetchUserSubmissions = async () => {
      try {
        const response = await fetch(
          `/api/userSubmissions/?problem_slug=${params.id}`
        );

        const data = await response.json();

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
        if (studyProblems.includes(params.id)) {
          // Load from local JSON file
          const data = await import(`@/data/study-problems/${params.id}-snapshots.json`);
          if (data.success) {
            const sortedSnapshots = data.snapshots.sort((a: CodeSnapshot, b: CodeSnapshot) => {
              if (a.version && b.version) {
                return a.version - b.version;
              }
              return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            });
            setSnapshots(sortedSnapshots);
          }
        } else {
          // Fetch from API
          const response = await fetch(
            `/api/codereplay/code-snapshots?problemId=${params.id}`
          );
          const data = await response.json();
          if (data.success) {
            const sortedSnapshots = data.snapshots.sort((a: CodeSnapshot, b: CodeSnapshot) => {
              if (a.version && b.version) {
                return a.version - b.version;
              }
              return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            });
            setSnapshots(sortedSnapshots);
          }
        }
      } catch (error) {
        console.error('Error fetching snapshots:', error);
      }
    };

    fetchLearnerSnapshots();
  }, [params.id]);

  const fetchSimilarityData = useCallback(async () => {
    if (studyProblems.includes(params.id)) {
      try {
        setIsMatrixLoading(true);

        // Import data from local JSON file
        const data = await import(`@/data/study-problems/${params.id}.json`);

        if (data.success) {
          setSimilarityMatrix({
            matrix: data.matrix,
            snippets: data.snippets
          });
        }
      } catch (error) {
        console.error('Error loading local study data:', error);
      } finally {
        setIsMatrixLoading(false);
      }
    } else {
      try {
        setIsMatrixLoading(true);

        const queryParams = new URLSearchParams({
          ...(params.type === 'problem' && { problemId: params.id }),
          ...(params.type === 'room' && { roomId: params.id })
        }).toString();

        const API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || 'https://codecflaskapi.duckdns.org';
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
    }
  }, [params.id, params.type]);

  // Initial data fetch
  useEffect(() => {
    fetchSimilarityData();
  }, [fetchSimilarityData]);

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
            <TabsTrigger value="network" className="data-[state=active]:bg-gray-700">
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
              <Loading message="Loading similarity matrix..." />
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-800 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold">Settings</h3>
                    <div className="flex items-center">
                      <label className="inline-flex items-center cursor-pointer space-x-2 text-gray-300">
                        <input
                          type="checkbox"
                          name="anonymize"
                          checked={anonymize}
                          onChange={() => setAnonymize(prev => !prev)}
                          className="w-4 h-4 sr-only peer"
                          title="Anonymize users to protect their identities."
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
                        <span>Anonymize Users</span>
                      </label>
                    </div>
                  </div>
                </div>

                {similarityMatrix ?
                  <SimilarityDashboard
                    anonymize={anonymize}
                    matrix={similarityMatrix.matrix}
                    snippets={similarityMatrix.snippets}
                  /> : "Similarity matrix empty"
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
                                <span className="truncate">
                                  {anonymize ? `Student ${index + 1}` : snippet.learner}</span>
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