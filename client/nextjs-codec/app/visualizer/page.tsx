'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import LoadingAnimation from '@/app/dashboard/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AttentionView from './attentionSingle';

interface SimilarStructure {
    cluster_id: number;
    type: string;  // Changed from string[] to string
    code_a: string[];
    code_b: string[];
    similarity: number;
}

interface HighlightedCode {
    code: string;
    highlights: HighlightInfo[];
}

interface DimensionAnalysis {
    dimension: number;
    score: number;
    tokens: string[];
    contexts: string[];
    activation_scores: number[];
}

interface GradientAnalysis {
    similarity: number;
    top_dimensions: number[];
    top_scores: number[];
    dimension_analysis: DimensionAnalysis[];
    visualization: string;
}

interface HighlightInfo {
    start: number;
    end: number;
    similarity: number;
    clusterId: number;
    structureType: string;
}

export default function CodeVisualizerPage() {
    const [code1, setCode1] = useState('');
    const [code2, setCode2] = useState('');
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [structures, setStructures] = useState<SimilarStructure[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [highlightedCode1, setHighlightedCode1] = useState<HighlightedCode>({ code: '', highlights: [] });
    const [highlightedCode2, setHighlightedCode2] = useState<HighlightedCode>({ code: '', highlights: [] });
    const [gradientAnalysis, setGradientAnalysis] = useState<GradientAnalysis | null>(null);
    const [selectedAnalysis, setSelectedAnalysis] = useState<string[]>(['all']);

    const analyzeCode = async () => {
        setLoading(true);
        setError(null);
        console.log("Starting code analysis...");

        try {
            if (!code1 || !code2) {
                throw new Error('Please provide both code snippets');
            }

            if (code1.length > 5000 || code2.length > 5000) {
                throw new Error('Code snippets are too large. Please limit to 5000 characters each.');
            }

            // Structural Analysis
            if (selectedAnalysis.includes('all') || selectedAnalysis.includes('structural')) {
                console.log("Performing structural analysis...");
                const structuralResponse = await fetch('http://localhost:5000/api/visualize-similarity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code1: code1.trim(), code2: code2.trim() })
                });

                if (!structuralResponse.ok) {
                    throw new Error(`Structural analysis failed: ${structuralResponse.statusText}`);
                }

                // Update the structural analysis handling
                const structuralData = await structuralResponse.json();
                console.log("Structural analysis result:", structuralData);
                // Change from imageUrl to image property
                if (structuralData.image) setImageUrl(structuralData.image);
                if (structuralData.structures) setStructures(structuralData.structures);
            }

            // Gradient Analysis
            if (selectedAnalysis.includes('all') || selectedAnalysis.includes('gradient')) {
                console.log("Performing gradient analysis...");
                const gradientResponse = await fetch('http://localhost:5000/api/analyze-gradients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code1: code1.trim(), code2: code2.trim() })
                });

                if (!gradientResponse.ok) {
                    throw new Error(`Gradient analysis failed: ${gradientResponse.statusText}`);
                }

                const gradientData = await gradientResponse.json();
                console.log("Gradient analysis result:", gradientData);
                // Update this line to handle the nested analysis property
                if (gradientData.success && gradientData.analysis) {
                    setGradientAnalysis({
                        similarity: gradientData.analysis.similarity || 0,
                        top_dimensions: gradientData.analysis.top_dimensions || [],
                        top_scores: gradientData.analysis.top_scores || [],
                        dimension_analysis: gradientData.analysis.dimension_analysis || [],
                        visualization: gradientData.analysis.visualization || ''
                    });
                }
            }

        } catch (err) {
            console.error('Analysis failed:', err);
            setError(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const prepareHighlightedCode = useCallback(() => {
        if (!structures.length) return;

        const highlights1: HighlightInfo[] = [];
        const highlights2: HighlightInfo[] = [];

        // Sort structures by similarity (highest first) to handle overlaps
        const sortedStructures = [...structures].sort((a, b) => b.similarity - a.similarity);

        sortedStructures.forEach(structure => {
            // Process each line group in the structure
            const lines1 = structure.code_a;
            const lines2 = structure.code_b;

            // Find positions in original code
            let pos1 = findPositionInCode(code1, lines1);
            let pos2 = findPositionInCode(code2, lines2);

            if (pos1) {
                highlights1.push({
                    start: pos1.start,
                    end: pos1.end,
                    similarity: structure.similarity,
                    clusterId: structure.cluster_id,
                    structureType: structure.type
                });
            }

            if (pos2) {
                highlights2.push({
                    start: pos2.start,
                    end: pos2.end,
                    similarity: structure.similarity,
                    clusterId: structure.cluster_id,
                    structureType: structure.type
                });
            }
        });

        setHighlightedCode1({ code: code1, highlights: highlights1 });
        setHighlightedCode2({ code: code2, highlights: highlights2 });
    }, [code1, code2, structures]);

    const findPositionInCode = (fullCode: string, lines: string[]): { start: number, end: number } | null => {
        const codeLines = fullCode.split('\n');
        const searchLines = lines.map(line => line.trim());

        for (let i = 0; i < codeLines.length; i++) {
            let found = true;
            for (let j = 0; j < searchLines.length; j++) {
                if (i + j >= codeLines.length || codeLines[i + j].trim() !== searchLines[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                const start = codeLines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0);
                const end = start + lines.join('\n').length;
                return { start, end };
            }
        }
        return null;
    };

    // Improve the highlighting in renderHighlightedCode
    const renderHighlightedCode = (highlightedCode: { code: string, highlights: HighlightInfo[] }) => {
        const { code, highlights } = highlightedCode;
        if (!highlights.length) return <span>{code}</span>;

        const segments: JSX.Element[] = [];
        let lastPos = 0;

        // Sort highlights by position and similarity
        const sortedHighlights = [...highlights].sort((a, b) => {
            if (a.start === b.start) return b.similarity - a.similarity;
            return a.start - b.start;
        });

        // Create a lookup for cluster colors
        const clusterColors = new Map<number, string>();
        highlights.forEach(h => {
            if (!clusterColors.has(h.clusterId)) {
                const colorIndex = h.clusterId % 5;
                const colors = [
                    'bg-blue-200 dark:bg-blue-800',
                    'bg-green-200 dark:bg-green-800',
                    'bg-yellow-200 dark:bg-yellow-800',
                    'bg-purple-200 dark:bg-purple-800',
                    'bg-orange-200 dark:bg-orange-800'
                ];
                clusterColors.set(h.clusterId, colors[colorIndex]);
            }
        });

        sortedHighlights.forEach((highlight, idx) => {
            if (highlight.start > lastPos) {
                segments.push(
                    <span key={`plain-${idx}`}>{code.slice(lastPos, highlight.start)}</span>
                );
            }

            const baseColor = clusterColors.get(highlight.clusterId) || 'bg-gray-200 dark:bg-gray-800';
            const opacity = Math.max(0.5, highlight.similarity);

            segments.push(
                <span
                    key={`highlight-${idx}`}
                    className={`relative group cursor-pointer ${baseColor}`}
                    style={{ opacity }}
                >
                    {code.slice(highlight.start, highlight.end)}
                    <div className="invisible group-hover:visible absolute z-20 bottom-full left-1/2 
                              transform -translate-x-1/2 mb-1 px-3 py-2 rounded-lg 
                              bg-gray-800 text-white text-xs whitespace-nowrap shadow-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Cluster {highlight.clusterId + 1}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-700">
                                {highlight.structureType}
                            </span>
                        </div>
                        <div className={highlight.similarity >= 0.7 ? 'text-green-400' :
                            highlight.similarity >= 0.4 ? 'text-yellow-400' : 'text-red-400'}>
                            Similarity: {(highlight.similarity * 100).toFixed(1)}%
                        </div>
                    </div>
                </span>
            );

            lastPos = highlight.end;
        });

        if (lastPos < code.length) {
            segments.push(<span key="plain-end">{code.slice(lastPos)}</span>);
        }

        return segments;
    };

    // Helper function to get color based on similarity score
    const getSimilarityColor = (similarity: number) => {
        if (similarity >= 0.7) return 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100';
        if (similarity >= 0.4) return 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100';
        return 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100';
    };

    // Update the renderSimilarStructures function to show code snippets
    const renderSimilarStructures = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Similar Code Structures
            </h3>
            {structures.length > 0 ? (
                structures.map((structure, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full">
                                    Cluster {structure.cluster_id + 1}
                                </span>
                                <span className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                    {structure.type}
                                </span>
                            </div>
                            <span className={`font-mono text-sm px-3 py-1 rounded-full ${getSimilarityColor(structure.similarity)}`}>
                                {(structure.similarity * 100).toFixed(2)}%
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Code Sample 1:</p>
                                <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                                    <code>{structure.code_a.join('\n')}</code>
                                </pre>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Code Sample 2:</p>
                                <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                                    <code>{structure.code_b.join('\n')}</code>
                                </pre>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No similar structures found
                </div>
            )}
        </div>
    );

    useEffect(() => {
        prepareHighlightedCode();
    }, [structures, prepareHighlightedCode]);

    // Add this effect to debug image data
    useEffect(() => {
        if (imageUrl) {
            console.log("Image URL set:", imageUrl.substring(0, 100) + "...");
            // Verify the image data is valid base64
            if (imageUrl.startsWith('data:image/png;base64,')) {
                console.log("Valid base64 image data detected");
            }
        }
    }, [imageUrl]);

    // Add this effect to monitor state changes
    useEffect(() => {
        console.log("Current state:", {
            hasImage: !!imageUrl,
            hasStructures: structures.length > 0,
            hasGradientAnalysis: !!gradientAnalysis,
            selectedAnalysis
        });
    }, [imageUrl, structures, gradientAnalysis, selectedAnalysis]);

    // Add debug logging for gradient analysis
    useEffect(() => {
        if (gradientAnalysis) {
            console.log("Gradient Analysis State:", {
                hasSimilarity: !!gradientAnalysis.similarity,
                hasVisualization: !!gradientAnalysis.visualization,
                dimensionsCount: gradientAnalysis.dimension_analysis?.length
            });
        }
    }, [gradientAnalysis]);

    const renderSideBySideComparison = () => (
        <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                    Code Sample 1
                </h3>
                <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto max-h-[600px]">
                    <code className="text-sm font-mono whitespace-pre-wrap">
                        {renderHighlightedCode(highlightedCode1)}
                    </code>
                </pre>
            </div>
            <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                    Code Sample 2
                </h3>
                <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto max-h-[600px]">
                    <code className="text-sm font-mono whitespace-pre-wrap">
                        {renderHighlightedCode(highlightedCode2)}
                    </code>
                </pre>
            </div>
        </div>
    );

    const renderGradientAnalysis = () => (
        <div className="space-y-6">
            {gradientAnalysis && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                        Embedding Analysis
                    </h3>

                    {/* Visualization Section */}
                    {gradientAnalysis.visualization && (
                        <div className="flex justify-center mb-6">
                            <img
                                src={gradientAnalysis.visualization}
                                alt="Embedding Gradient Analysis"
                                className="max-w-[600px] h-auto"
                            />
                        </div>
                    )}

                    {/* Token Analysis Section - More Compact Layout */}
                    {gradientAnalysis.dimension_analysis?.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Dimension Analysis
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {gradientAnalysis.dimension_analysis.map((dim, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-sm"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                Dimension {dim.dimension}
                                            </span>
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">
                                                {dim.score.toFixed(4)}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {dim.tokens.map((token, tokenIdx) => (
                                                <div key={tokenIdx} className="border-l-2 border-gray-300 pl-2">
                                                    <div className="flex items-baseline gap-2 flex-wrap">
                                                        <div className="flex-1 flex items-center justify-between">
                                                            <code className="text-xs px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded">
                                                                {token}
                                                            </code>
                                                            <span className="text-xs font-mono bg-blue-50 dark:bg-blue-900/50 px-2 py-0.5 rounded ml-2">
                                                                Activation: {dim.activation_scores[tokenIdx]?.toFixed(3)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {dim.contexts[tokenIdx] && (
                                                        <div className="text-xs text-gray-500 mt-1 pl-2 border-l border-gray-200">
                                                            Context: {dim.contexts[tokenIdx]}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
                    Code Similarity Analysis
                </h1>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Code Sample 1
                        </label>
                        <Textarea
                            value={code1}
                            onChange={(e) => setCode1(e.target.value)}
                            placeholder="Enter your first code sample here..."
                            className="h-64 font-mono text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Code Sample 2
                        </label>
                        <Textarea
                            value={code2}
                            onChange={(e) => setCode2(e.target.value)}
                            placeholder="Enter your second code sample here..."
                            className="h-64 font-mono text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="flex flex-wrap gap-2 justify-center">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedAnalysis(['all'])}
                            className={`${selectedAnalysis.includes('all') ? 'bg-blue-800 border-blue-500' : ''
                                }`}
                        >
                            All Analyses
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedAnalysis(['structural'])}
                            className={`${selectedAnalysis.includes('structural') ? 'bg-blue-800 border-blue-500' : ''
                                }`}
                        >
                            Structural Only
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedAnalysis(['gradient'])}
                            className={`${selectedAnalysis.includes('gradient') ? 'bg-blue-800 border-blue-500' : ''
                                }`}
                        >
                            Gradient Only
                        </Button>
                    </div>
                    <Button
                        onClick={analyzeCode}
                        disabled={loading || !code1 || !code2}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                    >
                        {loading ? 'Analyzing...' : 'Compare Code Samples'}
                    </Button>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center">
                        <LoadingAnimation />
                    </div>
                )}

                {(imageUrl || gradientAnalysis) && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
                        <Tabs defaultValue="structural" className="w-full">
                            <div className="flex items-center justify-between mb-6">
                                <TabsList>
                                    <TabsTrigger value="structural">
                                        Structural Analysis
                                    </TabsTrigger>
                                    <TabsTrigger value="embedding">
                                        Embedding Analysis
                                    </TabsTrigger>
                                    <TabsTrigger value="attention">
                                        Attention View
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="structural">
                                <Tabs defaultValue="visualization">
                                    <TabsList className="mb-4">
                                        <TabsTrigger value="visualization">Visualization</TabsTrigger>
                                        <TabsTrigger value="similar-sections">Similar Sections</TabsTrigger>
                                        <TabsTrigger value="comparison">Full Comparison</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="visualization">
                                        {imageUrl ? (
                                            <div className="flex justify-center">
                                                <img
                                                    src={imageUrl}
                                                    alt="Code Similarity Visualization"
                                                    className="max-w-2xl w-full"
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                No visualization available
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="similar-sections">
                                        {renderSimilarStructures()}
                                    </TabsContent>

                                    <TabsContent value="comparison">
                                        {renderSideBySideComparison()}
                                    </TabsContent>
                                </Tabs>
                            </TabsContent>

                            <TabsContent value="embedding">
                                {gradientAnalysis ? (
                                    renderGradientAnalysis()
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No embedding analysis available
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="attention">
                                <AttentionView codeSnippets={[code1, code2]} />
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>
        </div>
    );
}