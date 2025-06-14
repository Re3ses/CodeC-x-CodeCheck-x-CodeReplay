import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import LoadingAnimation from '@/app/dashboard/loading';

// Updated interface to match API structure
interface AttentionData {
    visualization: string;
    tokens1: string[];
    tokens2: string[];
    attention1: number[][];
    attention2: number[][];
    stats: {
        code1: { max: number; mean: number; std: number; };
        code2: { max: number; mean: number; std: number; };
    };
}

interface AttentionMaps {
    [layer: string]: {
        [head: string]: AttentionData;
    };
}

export default function AttentionView({ code1, code2 }: { code1: string; code2: string }) {
    const [layer, setLayer] = useState(4);
    const [head, setHead] = useState(3);
    const [attentionMaps, setAttentionMaps] = useState<AttentionMaps | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [autoProcess, setAutoProcess] = useState(false);

    const fetchAttentionData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log("Fetching attention data for codes:", { code1Length: code1.length, code2Length: code2.length });

            const response = await fetch('/api/analyze/attention', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    code1, 
                    code2
                })
            });

            const data = await response.json();
            console.log("Raw response:", data);

            // Check for error in the response
            if (data.error) {
                throw new Error(data.error);
            }

            // Check if attentionMaps exists in the response
            if (!data.attentionMaps) {
                throw new Error('Invalid attention data format received');
            }

            setAttentionMaps(data.attentionMaps);
        } catch (error) {
            console.error('Error in attention analysis:', error);
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (autoProcess && code1 && code2) {
            fetchAttentionData();
        }
    }, [code1, code2, autoProcess]);

    // Get current visualization and stats using string keys
    const currentVisualization = attentionMaps?.[layer.toString()]?.[head.toString()]?.visualization;
    const currentStats = attentionMaps?.[layer.toString()]?.[head.toString()]?.stats;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex gap-4 items-center">
                    <div>
                        <label className="block text-sm font-medium mb-1">Layer</label>
                        <select
                            value={layer}
                            onChange={(e) => setLayer(Number(e.target.value))}
                            className="px-2 py-1 rounded border dark:bg-gray-800"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i}>{i + 1}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Head</label>
                        <select
                            value={head}
                            onChange={(e) => setHead(Number(e.target.value))}
                            className="px-2 py-1 rounded border dark:bg-gray-800"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i}>{i + 1}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={autoProcess}
                            onChange={(e) => setAutoProcess(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        <span className="text-sm">Auto Process</span>
                    </label>
                    <Button 
                        onClick={fetchAttentionData}
                        disabled={loading || !code1 || !code2}
                    >
                        Process Attention
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-8">
                    <LoadingAnimation />
                </div>
            ) : currentVisualization ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                    <img
                        src={currentVisualization}
                        alt={`Attention visualization (Layer ${layer + 1}, Head ${head + 1})`}
                        className="max-w-full h-auto"
                    />
                    {currentStats && (
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <h4 className="font-medium mb-2">Code 1 Statistics</h4>
                                <div>Max: {currentStats.code1.max.toFixed(3)}</div>
                                <div>Mean: {currentStats.code1.mean.toFixed(3)}</div>
                                <div>Std: {currentStats.code1.std.toFixed(3)}</div>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Code 2 Statistics</h4>
                                <div>Max: {currentStats.code2.max.toFixed(3)}</div>
                                <div>Mean: {currentStats.code2.mean.toFixed(3)}</div>
                                <div>Std: {currentStats.code2.std.toFixed(3)}</div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    {autoProcess ? 'No attention data available' : 'Click Process to analyze attention'}
                </div>
            )}
        </div>
    );
}