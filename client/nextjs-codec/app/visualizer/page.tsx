'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import LoadingAnimation from '@/app/dashboard/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AttentionView from './AttentionView';
import StructuralView from './StructuralView';
import GradientView from './GradientView';
import { SimilarStructure, HighlightedCode, HighlightInfo, GradientAnalysis } from './types';


interface DimensionAnalysis {
  dimension: number;
  score: number;
  tokens: string[];
  contexts: string[];
  activation_scores: number[];
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
            try {
                const structuralResponse = await fetch('/api/visualize-similarity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code1: code1.trim(), code2: code2.trim() })
                });

                const structuralData = await structuralResponse.json();
                
                if (!structuralResponse.ok) {
                    throw new Error(structuralData.error || 'Structural analysis failed');
                }

                console.log("Structural analysis result:", structuralData);
                
                if (structuralData.success) {
                    if (structuralData.image) setImageUrl(structuralData.image);
                    if (structuralData.structures) setStructures(structuralData.structures);
                } else {
                    throw new Error(structuralData.error || 'Structural analysis failed');
                }
            } catch (structuralError) {
                console.error('Structural analysis error:', structuralError);
                throw new Error(`Structural analysis failed: ${structuralError.message}`);
            }
        }

        // Gradient Analysis
        if (selectedAnalysis.includes('all') || selectedAnalysis.includes('gradient')) {
            console.log("Performing gradient analysis...");
            try {
                const gradientResponse = await fetch('/api/analyze-gradients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code1: code1.trim(), code2: code2.trim() })
                });

                const gradientData = await gradientResponse.json();

                if (!gradientResponse.ok) {
                    throw new Error(gradientData.error || 'Gradient analysis failed');
                }

                console.log("Gradient analysis result:", gradientData);
                
                if (gradientData.success && gradientData.analysis) {
                    setGradientAnalysis({
                        similarity: gradientData.analysis.similarity || 0,
                        top_dimensions: gradientData.analysis.top_dimensions || [],
                        top_scores: gradientData.analysis.top_scores || [],
                        dimension_analysis: gradientData.analysis.dimension_analysis || [],
                        visualization: gradientData.analysis.visualization || ''
                    });
                } else {
                    throw new Error(gradientData.error || 'Invalid gradient analysis data');
                }
            } catch (gradientError) {
                console.error('Gradient analysis error:', gradientError);
                throw new Error(`Gradient analysis failed: ${gradientError.message}`);
            }
        }

    } catch (err) {
        console.error('Analysis failed:', err);
        setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
        setLoading(false);
    }
};



// Refs for synchronizing scroll
const code1Ref = useRef<HTMLPreElement>(null);
const code2Ref = useRef<HTMLPreElement>(null);

// Synchronized scrolling handler
const handleScroll = useCallback((sourceRef: React.RefObject<HTMLPreElement>, targetRef: React.RefObject<HTMLPreElement>) => {
    if (sourceRef.current && targetRef.current) {
        targetRef.current.scrollTop = sourceRef.current.scrollTop;
    }
}, []);



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
                className={`${
                    selectedAnalysis.includes('all') ? 'bg-blue-800 border-blue-500' : ''
                }`}
                >
                All Analyses
                </Button>
                <Button
                variant="outline"
                onClick={() => setSelectedAnalysis(['structural'])}
                className={`${
                    selectedAnalysis.includes('structural') ? 'bg-blue-800 border-blue-500' : ''
                }`}
                >
                Structural Only
                </Button>
                <Button
                variant="outline"
                onClick={() => setSelectedAnalysis(['gradient'])}
                className={`${
                    selectedAnalysis.includes('gradient') ? 'bg-blue-800 border-blue-500' : ''
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
                    <TabsTrigger value="attention" onClick={() => router.push('/visualizer/attention')}>
                        Attention View
                    </TabsTrigger>
                    </TabsList>
                </div>
    
                <TabsContent value="structural">
                    <StructuralView 
                        code1={code1}
                        code2={code2}
                        imageUrl={imageUrl}
                        structures={structures}
                        highlightedCode1={highlightedCode1}
                        highlightedCode2={highlightedCode2}
                    />
                </TabsContent>
    
                <TabsContent value="embedding">
                    <GradientView gradientAnalysis={gradientAnalysis} />
                </TabsContent>
    
                <TabsContent value="attention">
                    <AttentionView code1={code1} code2={code2} />
                </TabsContent>
                </Tabs>
            </div>
            )}
        </div>
        </div>
    );
}