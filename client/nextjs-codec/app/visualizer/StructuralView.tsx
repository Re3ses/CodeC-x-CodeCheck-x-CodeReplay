import { useCallback, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimilarStructure, HighlightedCode, HighlightInfo } from './types';

interface StructuralViewProps {
    code1: string;
    code2: string;
    imageUrl: string | null;
    structures: SimilarStructure[];
    highlightedCode1: HighlightedCode;
    highlightedCode2: HighlightedCode;
}

export default function StructuralView({ 
    code1, 
    code2, 
    imageUrl, 
    structures,
    highlightedCode1,
    highlightedCode2
}: StructuralViewProps) {
    // Move the rendering functions and related hooks here
    const code1Ref = useRef<HTMLPreElement>(null);
    const code2Ref = useRef<HTMLPreElement>(null);

    const handleScroll = useCallback((sourceRef: React.RefObject<HTMLPreElement>, targetRef: React.RefObject<HTMLPreElement>) => {
        if (sourceRef.current && targetRef.current) {
            targetRef.current.scrollTop = sourceRef.current.scrollTop;
        }
    }, []);


    const getSimilarityColor = (similarity: number) => {
        if (similarity >= 0.7) return 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100';
        if (similarity >= 0.4) return 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100';
        return 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100';
    };
    const renderHighlightedCode = ({ code, structures, isFirstCode = true }: { 
        code: string, 
        structures: SimilarStructure[], 
        isFirstCode?: boolean 
    }) => {
        const lines = code.split('\n');
        const lineHighlights: {
            [key: number]: Array<{
                clusterId: number;
                similarity: number;
                type: string;
                lines: string[];
                matchingLines: string[];
            }>;
        } = {};
    
        // Process structures to get line highlights
        structures.forEach(structure => {
            // Choose the correct code array based on which side we're rendering
            const sourceLines = isFirstCode ? structure.code_a : structure.code_b;
            const matchingLines = isFirstCode ? structure.code_b : structure.code_a;
    
            // Get the line numbers for each code snippet
            const codeLines = sourceLines.map((line, index) => ({
                lineContent: line.trim(),
                index: lines.findIndex(l => l.trim() === line.trim())
            })).filter(l => l.index !== -1);
    
            codeLines.forEach(({ index }) => {
                if (!lineHighlights[index]) {
                    lineHighlights[index] = [];
                }
    
                lineHighlights[index].push({
                    clusterId: structure.cluster_id,
                    similarity: structure.similarity,
                    type: structure.type,
                    lines: sourceLines,
                    matchingLines: matchingLines
                });
            });
        });
    
        // Sort highlights by similarity (highest first)
        Object.keys(lineHighlights).forEach(lineNum => {
            lineHighlights[Number(lineNum)].sort((a, b) => b.similarity - a.similarity);
        });
    
        return (
            <div className="font-mono text-sm">
                {lines.map((line, idx) => {
                    const highlights = lineHighlights[idx];
                    if (!highlights || !highlights.length) {
                        return <div key={idx} className="py-0.5">{line}</div>;
                    }
    
                    const topHighlight = highlights[0];
                    const hue = Math.round(120 * (1 - topHighlight.similarity));
                    const alpha = Math.max(0.2, Math.min(0.9, topHighlight.similarity));
    
                    return (
                        <div
                            key={idx}
                            className="relative group py-0.5 cursor-pointer"
                            style={{
                                backgroundColor: `hsla(${hue}, 100%, 50%, ${alpha})`
                            }}
                        >
                            {line}
                            <div className="invisible group-hover:visible absolute z-50 
                                left-1/2 transform -translate-x-1/2 bottom-full mb-2 
                                px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg 
                                whitespace-normal break-words min-w-[250px] max-w-[400px] overflow-auto">
                                <div className="font-medium mb-1">
                                    Cluster {topHighlight.clusterId + 1} - {topHighlight.type}
                                </div>
                                <div className="mb-2">
                                    Similarity: {(topHighlight.similarity * 100).toFixed(1)}%
                                </div>
                                {highlights.length > 1 && (
                                    <div className="text-gray-400 text-xs mb-2">
                                        +{highlights.length - 1} more similar matches
                                    </div>
                                )}
                                <div className="border-t border-gray-600 pt-2">
                                    <div className="font-medium mb-1">Matching Code:</div>
                                    <pre className="bg-gray-700 p-1 rounded max-h-32 overflow-y-auto">
                                        {topHighlight.matchingLines.join('\n')}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };
    const renderSideBySideComparison = () => (
        <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                    Code Sample 1
                </h3>
                <pre 
                    ref={code1Ref}
                    onScroll={() => handleScroll(code1Ref, code2Ref)}
                    className="relative p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto max-h-[600px]"
                >
                    <code className="text-sm font-mono whitespace-pre-wrap">
                        {renderHighlightedCode({ code: code1, structures, isFirstCode: true })}
                    </code>
                </pre>
            </div>
            <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                    Code Sample 2
                </h3>
                <pre 
                    ref={code2Ref}
                    onScroll={() => handleScroll(code2Ref, code1Ref)}
                    className="relative p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto max-h-[600px]"
                >
                    <code className="text-sm font-mono whitespace-pre-wrap">
                        {renderHighlightedCode({ code: code2, structures, isFirstCode: false })}
                    </code>
                </pre>
            </div>
        </div>
    );
    
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
    
    return (
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
    );
}