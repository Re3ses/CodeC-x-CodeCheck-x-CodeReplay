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

interface CodeSnapshot {
    code: string;
    timestamp: string;
    userId: string;
    problemId?: string;
    roomId?: string;
    submissionId?: string;
    version?: number;
}

interface SnapshotSimilarity {
    fromIndex: number;
    toIndex: number;
    similarity: number;
    codebertScore: number;
}

interface EnhancedPasteInfo {
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
    userId: string;
    similarity: number;
    codebertScore: number;
    timestamp: string;
    code: string;
    fileName: string;
    clusterId?: number;
    isLikelySource?: boolean;
}

interface SnippetInfo {
    userId: string;
    code: string;
    timestamp: string;
    fileName: string;
}

const getSimilarityColor = (similarity) => {
    if (similarity >= 80) return 'bg-red-700 text-white';
    if (similarity >= 60) return 'bg-yellow-600 text-white';
    return 'bg-gray-700 text-white';
};

export default function CodeReplayApp() {
    const params = { type: 'problem', id: 'problem-1' };
    const [similarityMatrix, setSimilarityMatrix] = useState<{
        matrix: number[][];
        snippets: SnippetInfo[];
    } | null>(null);
    const [isMatrixLoading, setIsMatrixLoading] = useState(true);
    const [snapshots, setSnapshots] = useState<CodeSnapshot[]>([]);
    const [sequentialSimilarities, setSequentialSimilarities] = useState<SnapshotSimilarity[]>([]);
    const [enhancedPastes, setEnhancedPastes] = useState<EnhancedPasteInfo[]>([]);

    const fetchSimilarityData = async () => {
        try {
            setIsMatrixLoading(true);

            const queryParam = params.type === 'problem' ?
                `problem_slug=${params.id}` :
                `room_id=${params.id}`;

            const response = await fetch('/api/codereplay/plagiarism', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: queryParam
                }),
            });

            const data = await response.json();
            if (data.success) {
                setSimilarityMatrix({
                    matrix: data.matrix,
                    snippets: data.snippets
                });
            }
            console.log(data);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setIsMatrixLoading(false);
        }
    };

    useEffect(() => {
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
    }, []);

    useEffect(() => {
        async function seedDatabase() {
            const response = await fetch('/api/seed');
            const data = await response.json();
            console.log(data);
        }
        seedDatabase();
    }, []);

    // Calculate statistics for each snippet
    const calculateSnippetStats = (matrix, index) => {
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
    const [advancedMetrics, setAdvancedMetrics] = useState<{ [key: string]: number }>({});

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
                            <SimilarityLoading />
                        ) : (
                            <div className="space-y-6">
                                {similarityMatrix ?
                                    <SimilarityDashboard
                                        matrix={similarityMatrix.matrix}
                                        snippets={similarityMatrix.snippets}
                                    /> : null
                                }

                                <div className="space-y-4">
                                    {similarityMatrix?.snippets.map((snippet, index) => {
                                        const stats = calculateSnippetStats(similarityMatrix.matrix, index);
                                        if (!stats) return null;

                                        return (
                                            <Card key={index} className="bg-gray-800/50 border-0 shadow-lg hover:bg-gray-800/70 transition-colors">
                                                {/* ... existing card content ... */}
                                            </Card>
                                        );
                                    })}
                                </div>
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
                                                        <span className="truncate">{snippet.userId}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <Badge className={`${(advancedMetrics[snippet.userId]?.weightedPlagiarismScore || 0) >= 80 ? 'bg-red-600' :
                                                            (advancedMetrics[snippet.userId]?.weightedPlagiarismScore || 0) >= 60 ? 'bg-yellow-600' :
                                                                'bg-gray-600'
                                                            }`}>
                                                            {(advancedMetrics[snippet.userId]?.weightedPlagiarismScore || 0).toFixed(1)}%
                                                        </Badge>
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
                                                    snapshots={snapshots.filter(s => s.userId === snippet.userId)}
                                                    sequentialSimilarities={sequentialSimilarities}
                                                    pastedSnippets={enhancedPastes}
                                                    onMetricsUpdate={(metrics) => {
                                                        setAdvancedMetrics(prev => ({
                                                            ...prev,
                                                            [snippet.userId]: metrics
                                                        }));
                                                    }}
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