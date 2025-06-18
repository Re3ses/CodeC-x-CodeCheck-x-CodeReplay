"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface AttentionViewProps {
    code1: string;
    code2: string;
}

interface AttentionData {
    tokens1: string[];
    tokens2: string[];
    attention_weights: number[][];
}

interface TokenPosition {
    x: number;
    y: number;
}

interface BackgroundColorMap {
    [key: number]: string;
}

const AttentionView: React.FC<AttentionViewProps> = ({ code1, code2 }) => {
    const [attentionData, setAttentionData] = useState<AttentionData | null>(null);
    const [highlightedIndices2, setHighlightedIndices2] = useState<number[]>([]);
    const [highlightedIndices1, setHighlightedIndices1] = useState<number[]>([]);
    const [selectedLayer, setSelectedLayer] = useState<number>(4);
    const [selectedHead, setSelectedHead] = useState<number>(3);
    const numLayers: number = 12;
    const numHeads: number = 12;
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const tokens1Ref = useRef<Array<HTMLSpanElement | null>>([]);
    const tokens2Ref = useRef<Array<HTMLSpanElement | null>>([]);
    const [backgroundColorMap2, setBackgroundColorMap2] = useState<BackgroundColorMap>({});
    const [backgroundColorMap1, setBackgroundColorMap1] = useState<BackgroundColorMap>({});
    const [isHovering, setIsHovering] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hoveredTokenIndex1, setHoveredTokenIndex1] = useState<number | null>(null);
    const [hoveredTokenIndex2, setHoveredTokenIndex2] = useState<number | null>(null);
    const [selectedTokenIndex1, setSelectedTokenIndex1] = useState<number | null>(null);
    const [selectedTokenIndex2, setSelectedTokenIndex2] = useState<number | null>(null);

    // Add this helper function near the top of the component
    const filterToken = (token: string): boolean => {
        // Remove tokens that are:
        // - Only whitespace
        // - Special CodeBERT tokens
        // - Single special characters
        return !(
            token.trim() === '' ||
            token === '[CLS]' ||
            token === '[SEP]' ||
            token === 'Ġ' ||
            /^[Ġ\s\W]$/.test(token) // Matches single special chars or whitespace
        );
    };

    // Reset refs when data changes
    useEffect(() => {
        tokens1Ref.current = [];
        tokens2Ref.current = [];
    }, [code1, code2, selectedLayer, selectedHead]);

    const fetchAttentionData = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://127.0.0.1:5000/api/visualize/attention', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code1, code2, layer: selectedLayer, head: selectedHead }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success && data.attention_data) {
                setAttentionData(data.attention_data);
            } else {
                console.error('Failed to fetch attention data:', data);
                setError('Failed to fetch attention data');
                setAttentionData(null);
            }
        } catch (error) {
            console.error('Error fetching attention data:', error);
            setError('Error fetching attention data');
            setAttentionData(null);
        } finally {
            setIsLoading(false);
        }
    }, [code1, code2, selectedLayer, selectedHead]);

    useEffect(() => {
        fetchAttentionData();
    }, [fetchAttentionData]);

    // Calculate line width based on weight
    const getLineWidth = useCallback((weight: number): number => {
        // Scale line width from 0.5 to 4 based on weight
        return 0.5 + (weight * 3.5);
    }, []);

    // Update the getAttentionColor function
    const getAttentionColor = useCallback((weight: number): string => {
        // Normalize weight between 0 and 1
        const normalizedWeight = Math.min(Math.max(weight, 0.05), 1.0);
        const opacity = 0.2 + (normalizedWeight * 0.8); // Scale opacity from 0.2 to 1.0

        // Calculate RGB values for green-to-red gradient
        // Green (low attention) to Red (high attention)
        const red = Math.floor(normalizedWeight * 255);  // Increases with weight
        const green = Math.floor((1 - normalizedWeight) * 255);  // Decreases with weight
        const blue = 0;  // Keep blue at 0 for pure green-to-red transition

        return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
    }, []);

    // Draw a single line between two token indices with weight-based styling
    const drawSingleLine = useCallback((
        fromIndex: number,
        fromContainer: number,
        toIndex: number,
        toContainer: number,
        weight: number = 0.5
    ): void => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const container = containerRef.current;

        if (!canvas || !ctx || !container) return;

        const getWordPosition = (refArray: (HTMLSpanElement | null)[], index: number): TokenPosition | null => {
            const element = refArray[index];
            if (!element) return null;

            const rect = element.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2 - containerRect.left,
                y: rect.top + rect.height / 2 - containerRect.top,
            };
        };

        const fromRefArray = fromContainer === 1 ? tokens1Ref.current : tokens2Ref.current;
        const toRefArray = toContainer === 1 ? tokens1Ref.current : tokens2Ref.current;

        const fromPosition = getWordPosition(fromRefArray, fromIndex);
        const toPosition = getWordPosition(toRefArray, toIndex);

        if (fromPosition && toPosition) {
            ctx.beginPath();
            ctx.strokeStyle = getAttentionColor(weight);
            ctx.lineWidth = getLineWidth(weight);
            ctx.moveTo(fromPosition.x, fromPosition.y);
            ctx.lineTo(toPosition.x, toPosition.y);
            ctx.stroke();
        }
    }, [getAttentionColor, getLineWidth]);

    // Draw all default attention lines without clearing
    const drawAllLinesByDefault = useCallback((): void => {
        if (!attentionData) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        try {
            const filteredTokens1 = attentionData.tokens1.filter(token => token !== "[CLS]" && token !== "[SEP]");
            const filteredTokens2 = attentionData.tokens2.filter(token => token !== "[CLS]" && token !== "[SEP]");
            const threshold: number = 0.1;

            // Safety check for empty arrays
            if (filteredTokens1.length === 0 || filteredTokens2.length === 0) return;

            // Create a mapping from filtered indices to original indices
            const filteredToOriginal1 = new Map<number, number>();
            const filteredToOriginal2 = new Map<number, number>();

            let filteredIdx: number = 0;
            attentionData.tokens1.forEach((token, origIdx) => {
                if (token !== "[CLS]" && token !== "[SEP]") {
                    filteredToOriginal1.set(filteredIdx, origIdx);
                    filteredIdx++;
                }
            });

            filteredIdx = 0;
            attentionData.tokens2.forEach((token, origIdx) => {
                if (token !== "[CLS]" && token !== "[SEP]") {
                    filteredToOriginal2.set(filteredIdx, origIdx);
                    filteredIdx++;
                }
            });

            // Draw lines from code1 to code2
            for (let i = 0; i < filteredTokens1.length; i++) {
                const originalIdx1 = filteredToOriginal1.get(i);
                if (originalIdx1 === undefined || originalIdx1 >= attentionData.attention_weights.length) continue;

                const weights = attentionData.attention_weights[originalIdx1];
                if (!weights) continue;

                // Find which filtered tokens in code2 have attention above threshold
                for (let j = 0; j < filteredTokens2.length; j++) {
                    const originalIdx2 = filteredToOriginal2.get(j);
                    if (originalIdx2 === undefined) continue;

                    // Find the corresponding weight index
                    let weightIdx: number = -1;
                    let filteredCount: number = 0;

                    for (let k = 0; k < attentionData.tokens2.length; k++) {
                        if (attentionData.tokens2[k] !== "[CLS]" && attentionData.tokens2[k] !== "[SEP]") {
                            if (filteredCount === j) {
                                weightIdx = filteredCount;
                                break;
                            }
                            filteredCount++;
                        }
                    }

                    if (weightIdx >= 0 && weightIdx < weights.length && weights[weightIdx] > threshold) {
                        const weight = weights[weightIdx];
                        drawSingleLine(i, 1, j, 2, weight);
                    }
                }
            }

            // Draw lines from code2 to code1
            for (let i = 0; i < filteredTokens2.length; i++) {
                const originalIdx2 = filteredToOriginal2.get(i);
                if (originalIdx2 === undefined) continue;

                const weightIndex = attentionData.tokens1.length + originalIdx2;
                if (weightIndex >= attentionData.attention_weights.length) continue;

                const weights = attentionData.attention_weights[weightIndex];
                if (!weights) continue;

                // Find which filtered tokens in code1 have attention above threshold
                for (let j = 0; j < filteredTokens1.length; j++) {
                    const originalIdx1 = filteredToOriginal1.get(j);
                    if (originalIdx1 === undefined) continue;

                    // Find the corresponding weight index
                    let weightIdx: number = -1;
                    let filteredCount: number = 0;

                    for (let k = 0; k < attentionData.tokens1.length; k++) {
                        if (attentionData.tokens1[k] !== "[CLS]" && attentionData.tokens1[k] !== "[SEP]") {
                            if (filteredCount === j) {
                                weightIdx = filteredCount;
                                break;
                            }
                            filteredCount++;
                        }
                    }

                    if (weightIdx >= 0 && weightIdx < weights.length && weights[weightIdx] > threshold) {
                        const weight = weights[weightIdx];
                        drawSingleLine(i, 2, j, 1, weight);
                    }
                }
            }
        } catch (error) {
            console.error("Error drawing all attention lines:", error);
        }
    }, [attentionData, drawSingleLine]);

    // Handle canvas sizing
    useEffect(() => {
        const resizeCanvas = (): void => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (canvas && container) {
                canvas.width = container.offsetWidth;
                canvas.height = container.offsetHeight;

                // Redraw lines if we have data and not hovering
                if (attentionData && !isHovering) {
                    drawAllLinesByDefault();
                }
            }
        };

        // Initial resize
        resizeCanvas();

        // Listen for window resize
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [attentionData, isHovering, drawAllLinesByDefault]);

    // Draw lines from one token to multiple other tokens with weight-based styling
    const drawLines = useCallback((
        fromTokenIndex: number,
        fromContainer: number,
        toIndices: number[],
        toContainer: number,
        weights: number[]
    ): void => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (!canvas || !ctx) return;

        toIndices.forEach((toIndex, idx) => {
            const weight = idx < weights.length ? weights[idx] : 0.5;
            drawSingleLine(fromTokenIndex, fromContainer, toIndex, toContainer, weight);
        });
    }, [drawSingleLine]);


    useEffect(() => {
        if (attentionData && !isHovering) {
            const timer = setTimeout(() => {
                drawAllLinesByDefault();
            }, 100); // Small delay to ensure DOM is ready
            return () => clearTimeout(timer);
        }
    }, [attentionData, isHovering, drawAllLinesByDefault]);

    const handleMouseOver1 = useCallback((index: number): void => {
        if (!attentionData) return;
        setIsHovering(true);
        setHoveredTokenIndex1(index);
    }, [attentionData, setHoveredTokenIndex1, setIsHovering]);

    const handleMouseOut1 = useCallback((): void => {
        if (selectedTokenIndex1 === null && selectedTokenIndex2 === null) {
            setIsHovering(false);
            setHoveredTokenIndex1(null);
            setHighlightedIndices2([]);
            setBackgroundColorMap2({});
            setBackgroundColorMap1({});
            drawAllLinesByDefault();
        }
    }, [drawAllLinesByDefault, selectedTokenIndex1, selectedTokenIndex2]);

    const handleMouseOver2 = useCallback((index: number): void => {
        if (!attentionData) return;
        setIsHovering(true);
        setHoveredTokenIndex2(index);
    }, [attentionData, setIsHovering, setHoveredTokenIndex2]);

    const handleMouseOut2 = useCallback((): void => {
        if (selectedTokenIndex1 === null && selectedTokenIndex2 === null) {
            setIsHovering(false);
            setHoveredTokenIndex2(null);
            setHighlightedIndices1([]);
            setBackgroundColorMap1({});
            setBackgroundColorMap2({});
            drawAllLinesByDefault();
        }
    }, [drawAllLinesByDefault, selectedTokenIndex1, selectedTokenIndex2]);

    const handleLayerChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        setSelectedLayer(parseInt(event.target.value, 10));
    };

    const handleHeadChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        setSelectedHead(parseInt(event.target.value, 10));
    };

    // Update the getFilteredTokens functions
    const getFilteredTokens1 = (): string[] => {
        return attentionData?.tokens1
            .filter(filterToken)
            .map(token => token.replace(/^Ġ/, '')) || [];
    };

    const getFilteredTokens2 = (): string[] => {
        return attentionData?.tokens2
            .filter(filterToken)
            .map(token => token.replace(/^Ġ/, '')) || [];
    };

    useEffect(() => {
        if (isHovering && hoveredTokenIndex1 !== null && attentionData) {
            try {
                // Create more accurate mappings between filtered and original indices
                const filteredToOriginal1 = new Map<number, number>();
                let filteredIdx = 0;

                // Store special token positions to adjust indices later
                const specialIndices1 = [];
                attentionData.tokens1.forEach((token, idx) => {
                    if (token === "[CLS]" || token === "[SEP]") {
                        specialIndices1.push(idx);
                    } else {
                        filteredToOriginal1.set(filteredIdx, idx);
                        filteredIdx++;
                    }
                });

                // Similar mapping for tokens2
                const filteredToOriginal2 = new Map<number, number>();
                filteredIdx = 0;
                const specialIndices2 = [];
                attentionData.tokens2.forEach((token, idx) => {
                    if (token === "[CLS]" || token === "[SEP]") {
                        specialIndices2.push(idx);
                    } else {
                        filteredToOriginal2.set(filteredIdx, idx);
                        filteredIdx++;
                    }
                });

                // Get original index for the hovered token
                const originalIdx = filteredToOriginal1.get(hoveredTokenIndex1);
                if (originalIdx === undefined) return;

                // Get weights for this token
                const weights = attentionData.attention_weights[originalIdx];
                if (!weights) return;

                const threshold = 0.1;
                const indicesToHighlight = [];
                const weightsToShow = [];
                const newBackgroundColorMap2 = {};

                // Create reverse mapping from original to filtered indices
                const originalToFiltered2 = new Map<number, number>();
                attentionData.tokens2.forEach((token, origIdx) => {
                    if (token !== "[CLS]" && token !== "[SEP]") {
                        let filteredPosition = origIdx;
                        // Adjust for special tokens before this position
                        for (const specialIdx of specialIndices2) {
                            if (specialIdx < origIdx) filteredPosition--;
                        }
                        originalToFiltered2.set(origIdx, filteredPosition);
                    }
                });

                // Find tokens with attention above threshold
                attentionData.tokens2.forEach((token, origIdx) => {
                    if (token !== "[CLS]" && token !== "[SEP]") {
                        const filteredIdx = originalToFiltered2.get(origIdx);
                        if (filteredIdx !== undefined && weights[origIdx] > threshold) {
                            indicesToHighlight.push(filteredIdx);
                            weightsToShow.push(weights[origIdx]);
                            newBackgroundColorMap2[filteredIdx] = getAttentionColor(weights[origIdx]);
                        }
                    }
                });

                // Set state and draw lines
                setHighlightedIndices2(indicesToHighlight);
                setHighlightedIndices1([hoveredTokenIndex1]);
                setBackgroundColorMap2(newBackgroundColorMap2);
                setBackgroundColorMap1({ [hoveredTokenIndex1]: 'rgba(0, 0, 255, 0.3)' });

                // Clear canvas and draw new lines
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (canvas && ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawLines(hoveredTokenIndex1, 1, indicesToHighlight, 2, weightsToShow);
                }
            } catch (error) {
                console.error("Error handling mouse over in useEffect:", error);
            }
        }
    }, [isHovering, hoveredTokenIndex1, attentionData, drawLines, getAttentionColor]);

    useEffect(() => {
        if (isHovering && hoveredTokenIndex2 !== null && attentionData) {
            try {
                // Create mappings between filtered and original indices
                const filteredToOriginal1 = new Map<number, number>();
                let filteredIdx = 0;
                attentionData.tokens1.forEach((token, origIdx) => {
                    if (token !== "[CLS]" && token !== "[SEP]") {
                        filteredToOriginal1.set(filteredIdx, origIdx);
                        filteredIdx++;
                    }
                });

                const filteredToOriginal2 = new Map<number, number>();
                filteredIdx = 0;
                attentionData.tokens2.forEach((token, origIdx) => {
                    if (token !== "[CLS]" && token !== "[SEP]") {
                        filteredToOriginal2.set(filteredIdx, origIdx);
                        filteredIdx++;
                    }
                });

                // Get original index for the hovered token
                const originalIdx = filteredToOriginal2.get(hoveredTokenIndex2);
                if (originalIdx === undefined) return;

                // For code2 tokens, the weight index is offset by the length of tokens1
                const weightIndex = attentionData.tokens1.length + originalIdx;
                if (weightIndex >= attentionData.attention_weights.length) return;

                const weights = attentionData.attention_weights[weightIndex];
                const threshold: number = 0.1;
                const indicesToHighlight: number[] = [];
                const weightsToShow: number[] = [];
                const newBackgroundColorMap1: BackgroundColorMap = {};

                // Map from original token1 indices to filtered indices
                const originalToFiltered1 = new Map<number, number>();
                filteredIdx = 0;
                attentionData.tokens1.forEach((token, origIdx) => {
                    if (token !== "[CLS]" && token !== "[SEP]") {
                        originalToFiltered1.set(origIdx, filteredIdx);
                        filteredIdx++;
                    }
                });

                // Find tokens with attention above threshold
                attentionData.tokens1.forEach((token, origIdx) => {
                    if (token !== "[CLS]" && token !== "[SEP]") {
                        const filteredIdx = originalToFiltered1.get(origIdx);
                        if (filteredIdx !== undefined && origIdx < weights.length && weights[origIdx] > threshold) {
                            indicesToHighlight.push(filteredIdx);
                            weightsToShow.push(weights[origIdx]);
                            newBackgroundColorMap1[filteredIdx] = getAttentionColor(weights[origIdx]);
                        }
                    }
                });

                setHighlightedIndices1(indicesToHighlight);
                setHighlightedIndices2([hoveredTokenIndex2]);
                setBackgroundColorMap1(newBackgroundColorMap1);
                setBackgroundColorMap2({ [hoveredTokenIndex2]: 'rgba(0, 0, 255, 0.3)' });

                // Clear canvas and draw new lines
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (canvas && ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawLines(hoveredTokenIndex2, 2, indicesToHighlight, 1, weightsToShow);
                }
                drawLines(hoveredTokenIndex2, 2, indicesToHighlight, 1, weightsToShow);
            } catch (error) {
                console.error("Error handling mouse over in useEffect for token2:", error);
            }
        }
    }, [isHovering, hoveredTokenIndex2, attentionData, drawLines, getAttentionColor]);

    const handleClick1 = useCallback((index: number): void => {
        if (!attentionData) return;
        setSelectedTokenIndex1(index);
        setSelectedTokenIndex2(null); // Clear other selection
        setIsHovering(true); // Keep hover state active
        setHoveredTokenIndex1(index);
    }, [attentionData]);

    const handleClick2 = useCallback((index: number): void => {
        if (!attentionData) return;
        setSelectedTokenIndex2(index);
        setSelectedTokenIndex1(null); // Clear other selection
        setIsHovering(true); // Keep hover state active
        setHoveredTokenIndex2(index);
    }, [attentionData]);

    return (
        <div ref={containerRef} className="flex flex-col gap-4 p-5 relative h-full">
            <div className="flex gap-4 items-center h-fit">
                <label htmlFor="layer">Layer:</label>
                <select
                    id="layer"
                    value={selectedLayer}
                    onChange={handleLayerChange}
                    className="border p-2"
                    disabled={isLoading}
                >
                    {Array.from({ length: numLayers }, (_, i) => (
                        <option key={i} value={i}>{i}</option>
                    ))}
                </select>
                <label htmlFor="head">Head:</label>
                <select
                    id="head"
                    value={selectedHead}
                    onChange={handleHeadChange}
                    className="border p-2"
                    disabled={isLoading}
                >
                    {Array.from({ length: numHeads }, (_, i) => (
                        <option key={i} value={i}>{i}</option>
                    ))}
                </select>
                <button
                    onClick={() => {
                        setSelectedTokenIndex1(null);
                        setSelectedTokenIndex2(null);
                        setIsHovering(false);
                        drawAllLinesByDefault();
                    }}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-700 rounded"
                    disabled={isLoading}
                >
                    Clear Selection
                </button>
                {isLoading && <span className="text-blue-500">Loading...</span>}
                {error && <span className="text-red-500">{error}</span>}
            </div>

            <div className="flex-1 flex justify-around">
                {/* Left column for Code Snippet 1 */}
                <div className="w-1/2 border border-gray-300 p-4 overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-2">Code Snippet 1</h2>
                    {isLoading ? (
                        <div>Loading tokens...</div>
                    ) : error ? (
                        <div>Error: {error}</div>
                    ) : getFilteredTokens1().length === 0 ? (
                        <div>No tokens available</div>
                    ) : (
                        <div className="flex flex-col items-start">
                            {getFilteredTokens1().map((token, index) => {
                                const displayedToken: string = token.replace("Ġ", " ");
                                return (
                                    <div
                                        key={`token1-${index}`}
                                        className="py-1 w-full"
                                    >
                                        <span
                                            ref={(el) => (tokens1Ref.current[index] = el)}
                                            className="cursor-pointer px-2 py-1 rounded inline-block"
                                            onMouseOver={() => handleMouseOver1(index)}
                                            onMouseOut={handleMouseOut1}
                                            onClick={() => handleClick1(index)}
                                            style={{
                                                backgroundColor: backgroundColorMap1[index] ||
                                                    (selectedTokenIndex1 === index ? 'rgba(0, 0, 255, 0.3)' : 'transparent'),
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                            {displayedToken}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right column for Code Snippet 2 */}
                <div className="w-1/2 border border-gray-300 p-4 overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-2">Code Snippet 2</h2>
                    {isLoading ? (
                        <div>Loading tokens...</div>
                    ) : error ? (
                        <div>Error: {error}</div>
                    ) : getFilteredTokens2().length === 0 ? (
                        <div>No tokens available</div>
                    ) : (
                        <div className="flex flex-col items-start">
                            {getFilteredTokens2().map((token, index) => {
                                const displayedToken: string = token.replace("Ġ", " ");
                                return (
                                    <div
                                        key={`token2-${index}`}
                                        className="py-1 w-full"
                                    >
                                        <span
                                            ref={(el) => (tokens2Ref.current[index] = el)}
                                            className="cursor-pointer px-2 py-1 rounded inline-block"
                                            onMouseOver={() => handleMouseOver2(index)}
                                            onMouseOut={handleMouseOut2}
                                            onClick={() => handleClick2(index)}
                                            style={{
                                                backgroundColor: backgroundColorMap2[index] ||
                                                    (selectedTokenIndex2 === index ? 'rgba(0, 0, 255, 0.3)' : 'transparent'),
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                            {displayedToken}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />
        </div>
    );
};

export default AttentionView;