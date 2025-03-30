"use client";
import { set } from 'lodash';
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

    // Generate color based on weight using a blue-based scheme
    const getAttentionColor = useCallback((weight: number): string => {
        // Darker blues for higher weights
        // Cap at 1.0 and ensure minimum opacity for visibility
        const normalizedWeight = Math.min(Math.max(weight, 0.05), 1.0);
        const opacity = 0.2 + (normalizedWeight * 0.8); // Scale opacity from 0.2 to 1.0

        // Blue color with intensity based on weight
        return `rgba(0, 0, ${Math.floor(100 + (normalizedWeight * 155))}, ${opacity})`;
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
            const filteredTokens1 = attentionData.tokens1.filter(token => token !== "[CLS]" && token !== "[SEP]" && token !== "Ċ");
            const filteredTokens2 = attentionData.tokens2.filter(token => token !== "[CLS]" && token !== "[SEP]" && token !== "Ċ");
            const threshold: number = 0.1;

            // Safety check for empty arrays
            if (filteredTokens1.length === 0 || filteredTokens2.length === 0) return;

            // Create a mapping from filtered indices to original indices
            const filteredToOriginal1 = new Map<number, number>();
            const filteredToOriginal2 = new Map<number, number>();

            let filteredIdx: number = 0;
            attentionData.tokens1.forEach((token, origIdx) => {
                if (token !== "[CLS]" && token !== "[SEP]" && token !== "Ċ") {
                    filteredToOriginal1.set(filteredIdx, origIdx);
                    filteredIdx++;
                }
            });

            filteredIdx = 0;
            attentionData.tokens2.forEach((token, origIdx) => {
                if (token !== "[CLS]" && token !== "[SEP]" && token !== "Ċ") {
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
                        if (attentionData.tokens2[k] !== "[CLS]" && attentionData.tokens2[k] !== "[SEP]" && attentionData.tokens2[k] !== "Ċ") {
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
                        if (attentionData.tokens1[k] !== "[CLS]" && attentionData.tokens1[k] !== "[SEP]" && attentionData.tokens1[k] !== "Ċ") {
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
        // ctx.clearRect(0, 0, canvas.width, canvas.height); // REMOVE THIS LINE

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
        // console.log("MouseOver1 - Start, isHovering:", isHovering);
        if (!attentionData) return;
        setIsHovering(true);
        setHoveredTokenIndex1(index);
        // console.log("MouseOver1 - After setIsHovering(true) and setHoveredTokenIndex1, isHovering:", isHovering, "hoveredTokenIndex1:", hoveredTokenIndex1);
    }, [attentionData, setHoveredTokenIndex1, setIsHovering]);

    const handleMouseOut1 = useCallback((): void => {
        // console.log("MouseOut1 - Start, isHovering:", isHovering);
        setIsHovering(false);
        setHoveredTokenIndex1(null);
        // console.log("MouseOut1 - After setIsHovering(false) and setHoveredTokenIndex1, isHovering:", isHovering, "hoveredTokenIndex1:", hoveredTokenIndex1);
        setHighlightedIndices2([]);
        setBackgroundColorMap2({});
        setBackgroundColorMap1({});
        drawAllLinesByDefault();
    }, [drawAllLinesByDefault, setIsHovering, setHoveredTokenIndex1]);

    const handleMouseOver2 = useCallback((index: number): void => {
        // console.log("MouseOver2 - Start, isHovering:", isHovering);
        if (!attentionData) return;
        setIsHovering(true);
        setHoveredTokenIndex2(index);
        // console.log("MouseOver2 - After setIsHovering(true) and setHoveredTokenIndex2, isHovering:", isHovering, "hoveredTokenIndex2:", hoveredTokenIndex2);
    }, [attentionData, setIsHovering, setHoveredTokenIndex2]);

    const handleMouseOut2 = useCallback((): void => {
        // console.log("MouseOut2 - Start, isHovering:", isHovering);
        setIsHovering(false);
        setHoveredTokenIndex2(null);
        // console.log("MouseOut2 - After setIsHovering(false) and setHoveredTokenIndex2, isHovering:", isHovering, "hoveredTokenIndex2:", hoveredTokenIndex2);
        setHighlightedIndices1([]);
        setBackgroundColorMap1({});
        setBackgroundColorMap2({});
        drawAllLinesByDefault();
    }, [drawAllLinesByDefault, setIsHovering, setHoveredTokenIndex2]);

    const handleLayerChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        setSelectedLayer(parseInt(event.target.value, 10));
    };

    const handleHeadChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        setSelectedHead(parseInt(event.target.value, 10));
    };

    // Safely filter tokens
    const getFilteredTokens1 = (): string[] => {
        return attentionData?.tokens1.filter(token => token !== "[CLS]" && token !== "[SEP]" && token !== "Ċ") || [];
    };

    const getFilteredTokens2 = (): string[] => {
        return attentionData?.tokens2.filter(token => token !== "[CLS]" && token !== "[SEP]" && token !== "Ċ") || [];
    };

    useEffect(() => {
        if (isHovering && hoveredTokenIndex1 !== null && attentionData) {
            console.log("useEffect triggered for MouseOver1 logic, hoveredTokenIndex1:", hoveredTokenIndex1);
            try {
                // Create mappings between filtered and original indices
                const filteredToOriginal1 = new Map<number, number>();
                let filteredIdx = 0;
                attentionData.tokens1.forEach((token, origIdx) => {
                    if (token !== "[CLS]" && token !== "[SEP]" && token !== "Ċ") {
                        filteredToOriginal1.set(filteredIdx, origIdx);
                        filteredIdx++;
                    }
                });

                const filteredToOriginal2 = new Map<number, number>();
                filteredIdx = 0;
                attentionData.tokens2.forEach((token, origIdx) => {
                    if (token !== "[CLS]" && token !== "[SEP]" && token !== "Ċ") {
                        filteredToOriginal2.set(filteredIdx, origIdx);
                        filteredIdx++;
                    }
                });

                // Get original index for the hovered token
                const originalIdx = filteredToOriginal1.get(hoveredTokenIndex1);
                if (originalIdx === undefined || originalIdx >= attentionData.attention_weights.length) return;

                const weights = attentionData.attention_weights[originalIdx];
                const threshold: number = 0.1;
                const indicesToHighlight: number[] = [];
                const weightsToShow: number[] = [];
                const newBackgroundColorMap2: BackgroundColorMap = {};

                // Map from original token2 indices to filtered indices
                const originalToFiltered2 = new Map<number, number>();
                filteredIdx = 0;
                attentionData.tokens2.forEach((token, origIdx) => {
                    if (token !== "[CLS]" && token !== "[SEP]" && token !== "Ċ") {
                        originalToFiltered2.set(origIdx, filteredIdx);
                        filteredIdx++;
                    }
                });

                // Find tokens with attention above threshold
                attentionData.tokens2.forEach((token, origIdx) => {
                    if (token !== "[CLS]" && token !== "[SEP]" && token !== "Ċ") {
                        const filteredIdx = originalToFiltered2.get(origIdx);
                        if (filteredIdx !== undefined && origIdx < weights.length && weights[origIdx] > threshold) {
                            indicesToHighlight.push(filteredIdx);
                            weightsToShow.push(weights[origIdx]);
                            newBackgroundColorMap2[filteredIdx] = getAttentionColor(weights[origIdx]);
                        }
                    }
                });

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
                console.log("useEffect (MouseOver1) - Before drawLines call - fromIndex:", hoveredTokenIndex1, "toIndices:", indicesToHighlight, "weights:", weightsToShow);
                drawLines(hoveredTokenIndex1, 1, indicesToHighlight, 2, weightsToShow);
            } catch (error) {
                console.error("Error handling mouse over in useEffect:", error);
            }
        }
    }, [isHovering, hoveredTokenIndex1, attentionData, drawLines, getAttentionColor]);

    useEffect(() => {
        if (isHovering && hoveredTokenIndex2 !== null && attentionData) {
            console.log("useEffect triggered for MouseOver2 logic, hoveredTokenIndex2:", hoveredTokenIndex2);
            try {
                // Create mappings between filtered and original indices
                const filteredToOriginal1 = new Map<number, number>();
                let filteredIdx = 0;
                attentionData.tokens1.forEach((token, origIdx) => {
                    if (token !== "[CLS]" && token !== "[SEP]" && token !== "Ċ") {
                        filteredToOriginal1.set(filteredIdx, origIdx);
                        filteredIdx++;
                    }
                });

                const filteredToOriginal2 = new Map<number, number>();
                filteredIdx = 0;
                attentionData.tokens2.forEach((token, origIdx) => {
                    if (token !== "[CLS]" && token !== "[SEP]" && token !== "Ċ") {
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
                    if (token !== "[CLS]" && token !== "[SEP]" && token !== "Ċ") {
                        originalToFiltered1.set(origIdx, filteredIdx);
                        filteredIdx++;
                    }
                });

                // Find tokens with attention above threshold
                attentionData.tokens1.forEach((token, origIdx) => {
                    if (token !== "[CLS]" && token !== "[SEP]" && token !== "Ċ") {
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
                console.log("useEffect (MouseOver2) - Before drawLines call - fromIndex:", hoveredTokenIndex2, "toIndices:", indicesToHighlight, "weights:", weightsToShow);
                drawLines(hoveredTokenIndex2, 2, indicesToHighlight, 1, weightsToShow);
            } catch (error) {
                console.error("Error handling mouse over in useEffect for token2:", error);
            }
        }
    }, [isHovering, hoveredTokenIndex2, attentionData, drawLines, getAttentionColor]);

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
                {isLoading && <span className="text-blue-500">Loading...</span>}
                {error && <span className="text-red-500">{error}</span>}
            </div>
            <div className='flex-1 flex flex-col justify-around'>
                <div className="flex-1 border border-gray-300 p-4 whitespace-pre-wrap font-mono max-h-fit">
                    <h2 className="text-lg font-semibold mb-2">Code Snippet 1</h2>
                    {isLoading ? (
                        <div>Loading tokens...</div>
                    ) : error ? (
                        <div>Error: {error}</div>
                    ) : getFilteredTokens1().length === 0 ? (
                        <div>No tokens available</div>
                    ) : (
                        getFilteredTokens1().map((token, index) => {
                            // Add a space between tokens (except the first)
                            const shouldAddSpace: boolean = index > 0;
                            const displayedToken: string = token.replace("Ġ", " ");
                            return (
                                <React.Fragment key={`token1-${index}`}>
                                    {shouldAddSpace && " "}
                                    <span
                                        ref={(el) => (tokens1Ref.current[index] = el)}
                                        className="cursor-pointer"
                                        onMouseOver={() => handleMouseOver1(index)}
                                        onMouseOut={handleMouseOut1}
                                        style={{
                                            backgroundColor: backgroundColorMap1[index] || 'transparent',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        {displayedToken}
                                    </span>
                                </React.Fragment>
                            );
                        })
                    )}
                </div>

                <div className="flex-1 border border-gray-300 p-4 whitespace-pre-wrap font-mono max-h-fit">
                    <h2 className="text-lg font-semibold mb-2">Code Snippet 2</h2>
                    {isLoading ? (
                        <div>Loading tokens...</div>
                    ) : error ? (
                        <div>Error: {error}</div>
                    ) : getFilteredTokens2().length === 0 ? (
                        <div>No tokens available</div>
                    ) : (
                        getFilteredTokens2().map((token, index) => {
                            // Add a space between tokens (except the first)
                            const shouldAddSpace: boolean = index > 0;
                            const displayedToken: string = token.replace("Ġ", " ");
                            return (
                                <React.Fragment key={`token2-${index}`}>
                                    {shouldAddSpace && " "}
                                    <span
                                        ref={(el) => (tokens2Ref.current[index] = el)}
                                        className="cursor-pointer"
                                        onMouseOver={() => handleMouseOver2(index)}
                                        onMouseOut={handleMouseOut2}
                                        style={{
                                            backgroundColor: backgroundColorMap2[index] || 'transparent',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        {displayedToken}
                                    </span>
                                </React.Fragment>
                            );
                        })
                    )}
                </div>
            </div>

            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />
        </div>
    );
};

export default AttentionView;