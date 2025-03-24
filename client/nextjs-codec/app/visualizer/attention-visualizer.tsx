import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Pattern {
    type: string;
    from_token: string;
    to_token: string;
    from_context: string;
    to_context: string;
    attention_score: number;
    significance: string;
}

interface LayerData {
    layer: number;
    attention_matrix: number[][];
    tokens1: string[];
    tokens2: string[];
    patterns: Pattern[];
}

interface AttentionData {
    similarity: number;
    analyzed_layers: number[];
    attention_data: {
        tokens1: string[];
        tokens2: string[];
        layers: LayerData[];
    };
}

const getContextColor = (context: string): string => {
    const colors: Record<string, string> = {
        'function': 'bg-blue-100 text-blue-800',
        'method': 'bg-green-100 text-green-800',
        'class': 'bg-purple-100 text-purple-800',
        'variable': 'bg-yellow-100 text-yellow-800',
        'parameter': 'bg-orange-100 text-orange-800',
        'import': 'bg-pink-100 text-pink-800',
        'other': 'bg-gray-100 text-gray-800'
    };
    return colors[context] || colors.other;
};

const getSignificanceColor = (score: number): string => {
    if (score > 0.7) return 'bg-red-100 text-red-800';
    if (score > 0.5) return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
};

export const AttentionVisualizer: React.FC<{ data?: AttentionData }> = ({ data }) => {
    const [selectedLayer, setSelectedLayer] = useState<number>(0);

    // Add debug logging
    console.log("AttentionVisualizer received data:", data);

    if (!data || !data.attention_data || !data.attention_data.layers) {
        console.log("Missing or invalid data:", { data });
        return (
            <Card className="p-6">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <p className="text-gray-500">No attention data available</p>
                    <p className="text-sm text-red-500">
                        {!data ? "No data provided" : 
                         !data.attention_data ? "No attention data" : 
                         "No layers available"}
                    </p>
                </div>
            </Card>
        );
    }

    // Ensure layer index is within bounds
    const layerCount = data.attention_data.layers.length;
    console.log("Available layers:", layerCount);
    
    if (selectedLayer >= layerCount) {
        console.log("Selected layer out of bounds, resetting to 0");
        setSelectedLayer(0);
    }

    const currentLayer = data.attention_data.layers[selectedLayer];
    console.log("Current layer data:", currentLayer);
    
    // Validate layer data and matrix dimensions
    if (!currentLayer || !currentLayer.attention_matrix) {
        return (
            <Card className="p-6">
                <p className="text-gray-500">Invalid layer data structure</p>
            </Card>
        );
    }

    // Ensure matrix dimensions match token lengths
    const matrix = currentLayer.attention_matrix;
    const tokens1 = currentLayer.tokens1 || [];
    const tokens2 = currentLayer.tokens2 || [];

    if (matrix.length !== tokens1.length || (matrix[0] && matrix[0].length !== tokens2.length)) {
        console.warn('Matrix dimensions mismatch with token lengths');
    }

    // Safe access to patterns with length check
    const safePatterns = currentLayer.patterns.filter(pattern => 
        pattern && 
        pattern.from_token && 
        pattern.to_token && 
        pattern.attention_score !== undefined
    );

    const LayerDescription = ({ layer }: { layer: number }) => {
        const descriptions = {
            0: "Early layer (Layer 1) focuses on syntactic patterns and basic code structure",
            5: "Middle layer (Layer 6) analyzes structural relationships between code elements",
            11: "Final layer (Layer 12) captures semantic relationships and code functionality"
        };
        return (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {descriptions[layer as keyof typeof descriptions] || 'Layer analysis'}
            </p>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Attention Analysis</h2>
                    <p className="text-gray-600">
                        Overall Similarity: {(data.similarity * 100).toFixed(1)}%
                    </p>
                </div>
                <Select
                    value={selectedLayer.toString()}
                    onValueChange={(value) => setSelectedLayer(Number(value))}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select layer" />
                    </SelectTrigger>
                    <SelectContent>
                        {data.analyzed_layers?.map((layer) => (
                            <SelectItem key={layer} value={layer.toString()}>
                                Layer {layer + 1}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">
                    Layer {currentLayer.layer + 1} Analysis
                </h3>
                <LayerDescription layer={currentLayer.layer} />
                
                {safePatterns.length > 0 ? (
                    <div className="space-y-4">
                        {safePatterns.map((pattern, idx) => (
                            <div
                                key={idx}
                                className="border rounded-lg p-4 bg-white dark:bg-gray-800"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <Badge variant="outline" className={getSignificanceColor(pattern.attention_score)}>
                                        {pattern.significance}
                                    </Badge>
                                    <span className="text-sm text-gray-500">
                                        {(pattern.attention_score * 100).toFixed(1)}% attention
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Badge variant="outline" className={getContextColor(pattern.from_context)}>
                                            {pattern.from_context}
                                        </Badge>
                                        <code className="block p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                            {pattern.from_token}
                                        </code>
                                    </div>
                                    <div className="space-y-2">
                                        <Badge variant="outline" className={getContextColor(pattern.to_context)}>
                                            {pattern.to_context}
                                        </Badge>
                                        <code className="block p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                            {pattern.to_token}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">
                        No significant attention patterns found for this layer
                    </p>
                )}
            </Card>

            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Understanding the Analysis</h3>
                <div className="space-y-3">
                    <p className="text-sm">
                        <span className="font-medium">Early Layer (1):</span> Focuses on syntactic patterns,
                        identifying basic code structures and syntax relationships.
                    </p>
                    <p className="text-sm">
                        <span className="font-medium">Middle Layer (6):</span> Analyzes structural relationships,
                        understanding how different code elements relate to each other.
                    </p>
                    <p className="text-sm">
                        <span className="font-medium">Final Layer (12):</span> Captures semantic relationships,
                        understanding the functional similarities between code segments.
                    </p>
                </div>
            </Card>
        </div>
    );
};