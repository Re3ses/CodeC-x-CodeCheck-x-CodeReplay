//page.tsx
'use client'
import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
interface AdvancedMetrics {
  maxChange: number;
  averageSimilarity: number;
  minSimilarity: number;
  normalizedVariance: number;
  weightedPlagiarismScore: number;
  pasteCount: number;
  bigPasteCount: number;
}

export default function CodeReplayApp() {
  const params = useParams<{ type: string, id: string }>();
  const [similarityMatrix, setSimilarityMatrix] = useState<{
    matrix: number[][];
    snippets: SnippetInfo[];
  } | null>(null);
  const [isMatrixLoading, setIsMatrixLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<CodeSnapshot[]>([]);
  const [enhancedPastes, setEnhancedPastes] = useState<EnhancedPasteInfo[]>([]);

  // fetch user submissions
  useEffect(() => {
    const fetchUserSubmissions = async () => {
      try {
        const query = {
          [params.type === 'problem' ? 'problem_slug' : 'roomId']: params.id,
          all: "True"
        };

        const response = await fetch(
          `/api/userSubmissions/?${new URLSearchParams(query).toString()}`
        );

        const data = await response.json();
        // console.log("user submissions", data);

        if (data.message === "Success! all via problem_slug" && Array.isArray(data.submission)) {
          // console.log("user submissions", data.message, data.submission);

          const enhancedPastes = data.submission.map((submission: any) => {
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
          // console.log("enhanced pastes", enhancedPastes);
          setEnhancedPastes(enhancedPastes);
        }
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
          `/api/codereplay/code-snapshots`
        );
        const data = await response.json();

        if (data.success && Array.isArray(data.snapshots)) {
          console.log("snapshots successfuly fetched", data.success, data.snapshots);
          const sortedSnapshots = data.snapshots.sort((a: CodeSnapshot, b: CodeSnapshot) => {
            if (a.version && b.version) {
              return a.version - b.version;
            }
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          });

          console.log("sorted snapshots", sortedSnapshots);

          setSnapshots(sortedSnapshots);
        }
      } catch (error) {
        console.error('Error fetching learner snapshots:', error);
      }
    };
    fetchLearnerSnapshots();
  }, []);

  useEffect(() => {
    const fetchSimilarityData = async () => {
      try {
        setIsMatrixLoading(true);

        const queryParam = params.type === 'problem' ?
          `problemId=${params.id}` :
          `roomId=${params.id}`;

        // const API_URL = process.env.FLASK_API_URL || 'https://codecflaskapi.duckdns.org';
        const API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';
        console.log("mongo API_URL:", process.env.MONGO_URI);
        // const API_PORT = process.env.FLASK_API_PORT || '5000';
        // console.log("API_URL:", API_URL, "API_PORT:", API_PORT);
        // const response = await fetch(`${API_URL}${API_PORT}/api/similarity/matrix?${queryParam}`, {
        const response = await fetch(`${API_URL}/api/similarity/matrix?${queryParam}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        console.log("matrix api data:", data);

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

    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/codereplay');
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.snippets)) {
            await fetchSimilarityData(); // Fetch matrix immediately
          }
        }
      } catch (error) {
        console.error('Initial fetch error:', error);
      }
    };

    fetchInitialData();
  }, [params.id, params.type]);

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
  // const [advancedMetrics, setAdvancedMetrics] = useState<{ [key: string]: AdvancedMetrics }>({});

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
              {similarityMatrix?.snippets.map((snippet, index) => (
                <div key={index} className={`${expandedCard === index ? 'col-span-full row-span-2' : ''
                  } transition-all duration-300`}>
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
                          pastedSnippets={enhancedPastes.filter(s => s.learner_id === snippet.learner_id)}
                        />
                      </CardContent>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
