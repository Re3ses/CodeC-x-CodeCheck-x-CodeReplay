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

    const filterToken = (token: string): boolean => {
        return !(
            token.trim() === '' ||
            token === '[CLS]' ||
            token === '[SEP]' ||
            token === 'Ġ' ||
            /^[Ġ\s\W]$/.test(token)
        );
    };

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

    const getLineWidth = useCallback((weight: number): number => {
        return 0.5 + (weight * 3.5);
    }, []);

    const getAttentionColor = useCallback((weight: number): string => {
        const normalizedWeight = Math.min(Math.max(weight, 0.05), 1.0);
        const opacity = 0.2 + (normalizedWeight * 0.8);
        const red = Math.floor(normalizedWeight * 255);
        const green = Math.floor((1 - normalizedWeight) * 255);
        const blue = 0;
        return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
    }, []);

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

    const drawAllLinesByDefault = useCallback((): void => {
        if (!attentionData) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const filteredTokens1 = attentionData.tokens1
            .map((token, index) => ({ token, originalIndex: index }))
            .filter(item => filterToken(item.token));
        const filteredTokens2 = attentionData.tokens2
            .map((token, index) => ({ token, originalIndex: index }))
            .filter(item => filterToken(item.token));
        const threshold: number = 0.1;

        filteredTokens1.forEach((token1, filteredIndex1) => {
            const originalIndex1 = token1.originalIndex;
            const weights = attentionData.attention_weights[originalIndex1];
            if (weights) {
                filteredTokens2.forEach((token2, filteredIndex2) => {
                    const originalIndex2 = token2.originalIndex;
                    if (originalIndex2 < weights.length && weights[originalIndex2] > threshold) {
                        drawSingleLine(filteredIndex1, 1, filteredIndex2, 2, weights[originalIndex2]);
                    }
                });
            }
        });

        filteredTokens2.forEach((token2, filteredIndex2) => {
            const originalIndex2 = token2.originalIndex;
            const weightStartIndex = attentionData.tokens1.length;
            if (weightStartIndex + originalIndex2 < attentionData.attention_weights.length) {
                const weights = attentionData.attention_weights[weightStartIndex + originalIndex2];
                if (weights) {
                    filteredTokens1.forEach((token1, filteredIndex1) => {
                        const originalIndex1 = token1.originalIndex;
                        if (originalIndex1 < weights.length && weights[originalIndex1] > threshold) {
                            drawSingleLine(filteredIndex2, 2, filteredIndex1, 1, weights[originalIndex1]);
                        }
                    });
                }
            }
        });
    }, [attentionData, drawSingleLine, filterToken]);

    useEffect(() => {
        const resizeCanvas = (): void => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (canvas && container) {
                canvas.width = container.offsetWidth;
                canvas.height = container.offsetHeight;
                if (attentionData && !isHovering) {
                    drawAllLinesByDefault();
                }
            }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [attentionData, isHovering, drawAllLinesByDefault]);

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
            }, 100);
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

    const getFilteredTokens1 = (): { token: string; originalIndex: number }[] => {
        return attentionData?.tokens1
            .map((token, index) => ({ token, originalIndex: index }))
            .filter(item => filterToken(item.token))
            .map(item => ({ ...item, token: item.token.replace(/^Ġ/, '') })) || [];
    };

    const getFilteredTokens2 = (): { token: string; originalIndex: number }[] => {
        return attentionData?.tokens2
            .map((token, index) => ({ token, originalIndex: index }))
            .filter(item => filterToken(item.token))
            .map(item => ({ ...item, token: item.token.replace(/^Ġ/, '') })) || [];
    };

    useEffect(() => {
        if (isHovering && hoveredTokenIndex1 !== null && attentionData) {
            try {
                const filteredTokens1WithIndex = attentionData.tokens1
                    .map((token, originalIndex) => ({ token, originalIndex }))
                    .filter(item => filterToken(item.token));
                const filteredTokens2WithIndex = attentionData.tokens2
                    .map((token, originalIndex) => ({ token, originalIndex }))
                    .filter(item => filterToken(item.token));

                const hoveredFilteredToken1 = filteredTokens1WithIndex[hoveredTokenIndex1];
                if (!hoveredFilteredToken1) return;
                const originalIndex1 = hoveredFilteredToken1.originalIndex;

                const weights = attentionData.attention_weights[originalIndex1];
                if (!weights) return;

                const threshold = 0.1;
                const indicesToHighlight: number[] = [];
                const weightsToShow: number[] = [];
                const newBackgroundColorMap2: BackgroundColorMap = {};

                filteredTokens2WithIndex.forEach((token2, filteredIndex2) => {
                    const originalIndex2 = token2.originalIndex;
                    if (originalIndex2 < weights.length && weights[originalIndex2] > threshold) {
                        indicesToHighlight.push(filteredIndex2);
                        weightsToShow.push(weights[originalIndex2]);
                        newBackgroundColorMap2[filteredIndex2] = getAttentionColor(weights[originalIndex2]);
                    }
                });

                setHighlightedIndices2(indicesToHighlight);
                setHighlightedIndices1([hoveredTokenIndex1]);
                setBackgroundColorMap2(newBackgroundColorMap2);
                setBackgroundColorMap1({ [hoveredTokenIndex1]: 'rgba(0, 0, 255, 0.3)' });

                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (canvas && ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawLines(hoveredTokenIndex1, 1, indicesToHighlight, 2, weightsToShow);
                }
            } catch (error) {
                console.error("Error handling hover for token1:", error);
            }
        }
    }, [isHovering, hoveredTokenIndex1, attentionData, drawLines, getAttentionColor, filterToken]);

    useEffect(() => {
        if (isHovering && hoveredTokenIndex2 !== null && attentionData) {
            try {
                const filteredTokens1WithIndex = attentionData.tokens1
                    .map((token, originalIndex) => ({ token, originalIndex }))
                    .filter(item => filterToken(item.token));
                const filteredTokens2WithIndex = attentionData.tokens2
                    .map((token, originalIndex) => ({ token, originalIndex }))
                    .filter(item => filterToken(item.token));

                const hoveredFilteredToken2 = filteredTokens2WithIndex[hoveredTokenIndex2];
                if (!hoveredFilteredToken2) return;
                const originalIndex2 = hoveredFilteredToken2.originalIndex;

                const weightStartIndex = attentionData.tokens1.length;
                if (weightStartIndex + originalIndex2 >= attentionData.attention_weights.length) return;

                const weights = attentionData.attention_weights[weightStartIndex + originalIndex2];
                if (!weights) return;

                const threshold: number = 0.1;
                const indicesToHighlight: number[] = [];
                const weightsToShow: number[] = [];
                const newBackgroundColorMap1: BackgroundColorMap = {};

                filteredTokens1WithIndex.forEach((token1, filteredIndex1) => {
                    const originalIndex1 = token1.originalIndex;
                    if (originalIndex1 < weights.length && weights[originalIndex1] > threshold) {
                        indicesToHighlight.push(filteredIndex1);
                        weightsToShow.push(weights[originalIndex1]);
                        newBackgroundColorMap1[filteredIndex1] = getAttentionColor(weights[originalIndex1]);
                    }
                });

                setHighlightedIndices1(indicesToHighlight);
                setHighlightedIndices2([hoveredTokenIndex2]);
                setBackgroundColorMap1(newBackgroundColorMap1);
                setBackgroundColorMap2({ [hoveredTokenIndex2]: 'rgba(0, 0, 255, 0.3)' });

                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (canvas && ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawLines(hoveredTokenIndex2, 2, indicesToHighlight, 1, weightsToShow);
                }
            } catch (error) {
                console.error("Error handling hover for token2:", error);
            }
        }
    }, [isHovering, hoveredTokenIndex2, attentionData, drawLines, getAttentionColor, filterToken]);

    const handleClick1 = useCallback((index: number): void => {
        if (!attentionData) return;
        const filteredTokens1WithIndex = attentionData.tokens1
            .map((token, originalIndex) => ({ token, originalIndex }))
            .filter(item => filterToken(item.token));
        setSelectedTokenIndex1(index);
        setSelectedTokenIndex2(null);
        setIsHovering(true);
        setHoveredTokenIndex1(index);
    }, [attentionData, filterToken]);

    const handleClick2 = useCallback((index: number): void => {
        if (!attentionData) return;
        const filteredTokens2WithIndex = attentionData.tokens2
            .map((token, originalIndex) => ({ token, originalIndex }))
            .filter(item => filterToken(item.token));
        setSelectedTokenIndex2(index);
        setSelectedTokenIndex1(null);
        setIsHovering(true);
        setHoveredTokenIndex2(index);
    }, [attentionData, filterToken]);

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
                            {getFilteredTokens1().map(({ token, originalIndex }, index) => {
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
                            {getFilteredTokens2().map(({ token, originalIndex }, index) => {
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