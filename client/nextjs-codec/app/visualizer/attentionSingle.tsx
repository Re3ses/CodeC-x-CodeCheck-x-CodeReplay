import React, { useState, useEffect, useRef } from 'react';

interface AttentionProps {
    codeSnippets: string[];
}

// Define proper types based on the actual API response structure
interface AttentionResponse {
    success: boolean;
    similarities: {
        tokens: string[];
        layer_wise_attention: number[][][][]; // [batch_size][num_heads][seq_len][seq_len]
    };
    error?: string;
}

// Token with its highlighting information
interface HighlightedToken {
    token: string;
    similarity: number;
    bestMatch: { index: number; attention: number } | null;
}

const AttentionView: React.FC<AttentionProps> = ({ codeSnippets }) => {
    const [code1, setCode1] = useState(codeSnippets[0] || '');
    const [code2, setCode2] = useState(codeSnippets[1] || '');
    const [tokens, setTokens] = useState<string[]>([]);
    const [attentionData, setAttentionData] = useState<number[][][][]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hoveredToken, setHoveredToken] = useState<HighlightedToken | null>(null);

    const tooltipRef = useRef<HTMLDivElement>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setCode1(codeSnippets[0] || '');
        setCode2(codeSnippets[1] || '');
    }, [codeSnippets]);

    // Fetch attention data when code snippets change
    useEffect(() => {
        if (code1 && code2) {
            fetchAttentionData();
        }
    }, [code1, code2]);

    // Clean up tokens by removing "Ġ" and reconstructing the original code
    const cleanTokens = (tokens: string[]): string[] => {
        return tokens.map(token => token.replace(/^Ġ/, ' '));
    };

    const fetchAttentionData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:5000/api/visualize/attention', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code_snippets: [code1, code2] }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: AttentionResponse = await response.json();
            console.log("API Response:", data);

            if (!data.success) {
                throw new Error(data.error || 'Unknown error from API');
            }

            const cleanedTkns = cleanTokens(data.similarities.tokens);
            setTokens(cleanedTkns);
            setAttentionData(data.similarities.layer_wise_attention);
        } catch (error) {
            console.error('Error fetching attention data:', error);
            setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    // Find the separator token index (to separate code1 tokens from code2 tokens)
    const findSepIndex = (): number => {
        const sepIndex = tokens.indexOf('[SEP]');
        if (sepIndex === -1) {
            console.warn("Separator token '[SEP]' not found. Using middle of token array as fallback.");
            return Math.floor(tokens.length / 2);
        }
        return sepIndex;
    };


    // Process code to create highlighted spans based on attention weights using maximum attention across all heads
    const processCodeWithAttention = (code: string, isCode1: boolean): JSX.Element[] => {
        if (!tokens.length || !attentionData.length) {
            return [<pre key="raw" className="text-gray-300">{code}</pre>];
        }

        const sepIndex = findSepIndex();
        const firstBatchAttention = attentionData[0]; // Assumes a single batch
        const numHeads = firstBatchAttention.length;

        // Tokenize the code string
        const codeTokens = tokenizeCode(code);

        // Get the relevant token indices for this code snippet
        const relevantIndices = isCode1
            ? Array.from({ length: sepIndex }, (_, i) => i)
            : Array.from({ length: tokens.length - sepIndex - 1 }, (_, i) => i + sepIndex + 1);

        return codeTokens.map((token, idx) => {
            // Look for this token in the relevant token indices
            const tokenIndices = relevantIndices.filter(i => tokens[i].includes(token.text));

            if (tokenIndices.length === 0) {
                // No matching token in the attention data
                return (
                    <span key={`${idx}-${token.text}`} className="text-gray-300">
                        {token.text}
                    </span>
                );
            }

            // Find the maximum attention weight for this token across all heads, and track only the best match
            let maxAttention = 0;
            let bestMatch: { index: number; attention: number } = { index: -1, attention: 0 };

            tokenIndices.forEach(tokenIndex => {
                // Get indices for tokens in the other code snippet
                const otherIndices = isCode1
                    ? Array.from({ length: tokens.length - sepIndex - 1 }, (_, i) => i + sepIndex + 1)
                    : Array.from({ length: sepIndex }, (_, i) => i);

                otherIndices.forEach(otherIndex => {
                    // Loop over all heads to find the maximum attention
                    let currentMax = 0;
                    for (let head = 0; head < numHeads; head++) {
                        const att = firstBatchAttention[head][tokenIndex][otherIndex];
                        if (att > currentMax) {
                            currentMax = att;
                        }
                    }
                    if (currentMax > maxAttention) {
                        maxAttention = currentMax;
                        bestMatch = { index: otherIndex, attention: currentMax };
                    }
                });
            });

            // Choose color based on attention weight
            const getBackgroundColor = () => {
                if (maxAttention < 0.01) return "transparent";
                if (maxAttention < 0.33) return "bg-blue-900";
                if (maxAttention < 0.66) return "bg-blue-600";
                return "bg-blue-400";
            };

            // Check if this token or its best match is currently hovered
            const isHighlighted = hoveredToken?.token === token.text || (bestMatch && tokens[bestMatch.index] === hoveredToken?.token);

            return (
                <span
                    key={`${idx}-${token.text}`}
                    className={`${getBackgroundColor()} px-0.5 rounded cursor-pointer transition-colors duration-200 
                    ${isHighlighted ? "ring-2 ring-yellow-400" : ""}`}
                    data-token={token.text}
                    data-similarity={maxAttention.toFixed(4)}
                    onMouseEnter={(e) => handleTokenHover(e, token.text, maxAttention, bestMatch)}
                    onMouseMove={updateTooltipPosition}
                    onMouseLeave={() => setHoveredToken(null)}
                >
                    {token.text}
                </span>
            );
        });
    };

    // Simple tokenizer function
    const tokenizeCode = (code: string): { text: string }[] => {
        // This is a simple tokenizer - you might want a more sophisticated one
        // that better matches CodeBERT's tokenization
        const regex = /([a-zA-Z_]\w*|\d+|\s+|[^\w\s]+)/g;
        const matches = code.match(regex) || [];
        return matches.map(text => ({ text }));
    };

    // Handle token hover, now passing only the best match
    const handleTokenHover = (
        e: React.MouseEvent,
        token: string,
        similarity: number,
        bestMatch: { index: number; attention: number } | null
    ) => {
        setHoveredToken({ token, similarity, bestMatch });
        updateTooltipPosition(e);
    };

    // Update tooltip position
    const updateTooltipPosition = (e: React.MouseEvent) => {
        // Position the tooltip near the cursor but not directly under it
        setTooltipPosition({
            x: e.clientX + 10,
            y: e.clientY + 10
        });
    };

    return (
        <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h1 className="text-xl font-bold text-gray-200">CodeBERT Attention Visualizer</h1>
                <button
                    onClick={fetchAttentionData}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-gray-200 px-4 py-1 rounded disabled:bg-gray-600"
                >
                    {isLoading ? 'Loading...' : 'Analyze'}
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="border-l-4 border-red-500 bg-gray-800 text-red-400 p-4 mx-4 my-2 rounded">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Legend */}
            <div className="mx-4 my-4 p-3 rounded bg-gray-800">
                <div className="flex space-x-4">
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-900 mr-2"></div>
                        <span className="text-sm text-gray-300">Low (1% - 33%)</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-600 mr-2"></div>
                        <span className="text-sm text-gray-300">Medium (34% - 66%)</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-400 mr-2"></div>
                        <span className="text-sm text-gray-300">High (67% - 100%)</span>
                    </div>
                </div>
            </div>

            {/* Code snippets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="bg-gray-700 text-gray-200 p-3 font-semibold">
                        Code Snippet 1
                    </div>
                    <div className="p-4 font-mono text-sm whitespace-pre-wrap bg-gray-800">
                        {processCodeWithAttention(code1, true)}
                    </div>
                </div>

                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="bg-gray-700 text-gray-200 p-3 font-semibold">
                        Code Snippet 2
                    </div>
                    <div className="p-4 font-mono text-sm whitespace-pre-wrap bg-gray-800">
                        {processCodeWithAttention(code2, false)}
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            {hoveredToken && (
                <div
                    ref={tooltipRef}
                    className="fixed bg-gray-800 p-3 rounded shadow-lg z-50 max-w-xs border border-gray-600 text-gray-200"
                    style={{
                        left: `${tooltipPosition.x}px`,
                        top: `${tooltipPosition.y}px`
                    }}
                >
                    <h3 className="font-bold mb-1">{hoveredToken.token}</h3>
                    <p className="text-sm mb-1">
                        Attention strength: <span className="font-semibold">{(hoveredToken.similarity * 100).toFixed(2)}%</span>
                    </p>
                    {hoveredToken.bestMatch && (
                        <div className="text-xs">
                            <p className="font-semibold mb-1">Best match:</p>
                            <ul className="pl-2">
                                <li>
                                    "{tokens[hoveredToken.bestMatch.index]}" ({(hoveredToken.bestMatch.attention * 100).toFixed(1)}%)
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Token information panel */}
            <div className="mt-4 bg-gray-800 rounded-lg overflow-hidden">
                <div className="bg-gray-700 text-gray-200 p-3 font-semibold">
                    Token Information
                </div>
                <div className="p-4 max-h-48 overflow-y-auto">
                    {tokens.length > 0 ? (
                        <div className="grid grid-cols-12 gap-2 text-sm">
                            <div className="col-span-1 font-semibold text-gray-300">Index</div>
                            <div className="col-span-9 font-semibold text-gray-300">Token</div>
                            <div className="col-span-2 font-semibold text-gray-300">Position</div>

                            {tokens.map((token, idx) => {
                                const sepIndex = findSepIndex();
                                const position = idx <= sepIndex ? "Code 1" : "Code 2";

                                return (
                                    <React.Fragment key={idx}>
                                        <div className="col-span-1 text-gray-400">{idx}</div>
                                        <div className="col-span-9 font-mono bg-gray-900 px-2 py-1 rounded text-gray-300">{token}</div>
                                        <div className="col-span-2 text-gray-400">{position}</div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500">Run the analysis to see token information</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttentionView;
