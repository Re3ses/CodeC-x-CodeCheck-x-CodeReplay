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
    width: number;
    height: number;
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
    const [renderedTokens1, setRenderedTokens1] = useState<string[]>([]);
    const [renderedTokens2, setRenderedTokens2] = useState<string[]>([]);

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
        return `rgba(0, 0, ${Math.floor(100 + (normalizedWeight * 155))}, ${opacity})`;
    }, []);

    const drawSingleLine = useCallback((
        fromRenderedIndex: number,
        fromContainer: number,
        toRenderedIndex: number,
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
            const containerRect = containerRef.current ? containerRef.current.getBoundingClientRect() : { left: 0, top: 0 };
            const position = {
                x: rect.left + rect.width / 2 - containerRect.left,
                y: rect.top + rect.height / 2 - containerRect.top,
                width: rect.width,
                height: rect.height,
            };
            console.log(`Token ${index} in refArray (length ${refArray.length}):`, element.textContent.trim(), 'Rect:', rect, 'Container Rect:', containerRect, 'Position:', position);
            return position;
        };

        const fromRefArray = fromContainer === 1 ? tokens1Ref.current : tokens2Ref.current;
        const toRefArray = toContainer === 1 ? tokens1Ref.current : tokens2Ref.current;

        const fromPosition = getWordPosition(fromRefArray, fromRenderedIndex);
        const toPosition = getWordPosition(toRefArray, toRenderedIndex);

        if (fromPosition && toPosition) {
            ctx.beginPath();
            ctx.strokeStyle = getAttentionColor(weight);
            ctx.lineWidth = getLineWidth(weight);
            ctx.moveTo(fromPosition.x, fromPosition.y);
            ctx.lineTo(toPosition.x, toPosition.y);
            ctx.stroke();
        }
    }, [getAttentionColor, getLineWidth]);

    const getFilteredOriginalIndices1 = useCallback(() => {
        return attentionData?.tokens1.reduce((acc, token, index) => {
            if (token !== "[CLS]" && token !== "[SEP]") {
                acc.push(index);
            }
            return acc;
        }, [] as number[]) || [];
    }, [attentionData]);

    const getFilteredOriginalIndices2 = useCallback(() => {
        return attentionData?.tokens2.reduce((acc, token, index) => {
            if (token !== "[CLS]" && token !== "[SEP]") {
                acc.push(index);
            }
            return acc;
        }, [] as number[]) || [];
    }, [attentionData]);

    const drawAllLinesByDefault = useCallback((): void => {
        if (!attentionData) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        try {
            const filteredOriginalIndices1 = getFilteredOriginalIndices1();
            const filteredOriginalIndices2 = getFilteredOriginalIndices2();

            renderedTokens1.forEach((renderedToken1, index1) => {
                if (renderedToken1 === "<br />" || renderedToken1 === "") return;
                const originalIndex1 = filteredOriginalIndices1[index1];
                if (originalIndex1 === undefined || originalIndex1 >= attentionData.attention_weights.length) return;

                const weights = attentionData.attention_weights[originalIndex1];
                if (!weights) return;

                renderedTokens2.forEach((renderedToken2, index2) => {
                    if (renderedToken2 === "<br />" || renderedToken2 === "") return;
                    const originalIndex2 = filteredOriginalIndices2[index2];
                    if (originalIndex2 === undefined || originalIndex2 >= weights.length) return;

                    const filteredIndex2InWeights = filteredOriginalIndices2.indexOf(originalIndex2);
                    if (filteredIndex2InWeights !== -1 && filteredIndex2InWeights < weights.length) {
                        const weight = weights[filteredIndex2InWeights];
                        if (weight > 0.1) {
                            drawSingleLine(index1, 1, index2, 2, weight);
                        }
                    }
                });
            });

            renderedTokens2.forEach((renderedToken2, index2) => {
                if (renderedToken2 === "<br />" || renderedToken2 === "") return;
                const originalIndex2 = filteredOriginalIndices2[index2];
                if (originalIndex2 === undefined) return;

                const weightIndex = attentionData.tokens1.length + originalIndex2;
                if (weightIndex >= attentionData.attention_weights.length) return;

                const weights = attentionData.attention_weights[weightIndex];
                if (!weights) return;

                renderedTokens1.forEach((renderedToken1, index1) => {
                    if (renderedToken1 === "<br />" || renderedToken1 === "") return;
                    const originalIndex1 = filteredOriginalIndices1[index1];
                    if (originalIndex1 === undefined || originalIndex1 >= weights.length) return;

                    const filteredIndex1InWeights = filteredOriginalIndices1.indexOf(originalIndex1);
                    if (filteredIndex1InWeights !== -1 && filteredIndex1InWeights < weights.length) {
                        const weight = weights[filteredIndex1InWeights];
                        if (weight > 0.1) {
                            drawSingleLine(index2, 2, index1, 1, weight);
                        }
                    }
                });
            });
        } catch (error) {
            console.error("Error drawing all attention lines:", error);
        }
    }, [attentionData, drawSingleLine, getFilteredOriginalIndices1, getFilteredOriginalIndices2, renderedTokens1, renderedTokens2]);

    const drawLines = useCallback((
        fromRenderedIndex: number,
        fromContainer: number,
        toRenderedIndices: number[],
        toContainer: number,
        weights: number[]
    ): void => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        toRenderedIndices.forEach((toRenderedIndex, idx) => {
            const weight = idx < weights.length ? weights[idx] : 0.5;
            drawSingleLine(fromRenderedIndex, fromContainer, toRenderedIndex, toContainer, weight);
        });
    }, [drawSingleLine]);

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

    useEffect(() => {
        if (attentionData && !isHovering) {
            const timer = setTimeout(() => {
                drawAllLinesByDefault();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [attentionData, isHovering, drawAllLinesByDefault]);


    useEffect(() => {
        if (attentionData) {
            const renderTokens = (tokens: string[]) => {
                return tokens.map((token, index, array) => {
                    if (token === "[CLS]" || token === "[SEP]") {
                        return "";
                    }
                    if (token === "Ċ") {
                        return "<br />";
                    }

                    let displayedToken = "";
                    if (token.startsWith("Ġ")) {
                        let spaceCount = 0;
                        while (spaceCount < token.length && token[spaceCount] === "Ġ") {
                            spaceCount++;
                        }
                        const isIndentation = index === 0 || array[index - 1] === "Ċ";

                        if (spaceCount >= 2 && isIndentation) {
                            displayedToken = "\u00A0".repeat(spaceCount) + token.substring(spaceCount).replace("Ġ", " ");
                        } else {
                            displayedToken = token.replace("Ġ", " ");
                        }
                    } else {
                        displayedToken = token.replace("Ġ", " ");
                    }
                    return displayedToken;
                });
            };

            setRenderedTokens1(renderTokens(attentionData.tokens1));
            setRenderedTokens2(renderTokens(attentionData.tokens2));

            tokens1Ref.current = Array(attentionData.tokens1.filter(token => token !== "[CLS]" && token !== "[SEP]").length).fill(null);
            tokens2Ref.current = Array(attentionData.tokens2.filter(token => token !== "[CLS]" && token !== "[SEP]").length).fill(null);

        }
    }, [attentionData]);

    const handleMouseOver1 = useCallback((renderedIndex: number): void => {
        if (!attentionData) return;
        setIsHovering(true);
        setHoveredTokenIndex1(renderedIndex);
    }, [attentionData, setIsHovering, setHoveredTokenIndex1]);

    const handleMouseOut1 = useCallback((): void => {
        setIsHovering(false);
        setHoveredTokenIndex1(null);
        setHighlightedIndices2([]);
        setBackgroundColorMap2({});
        setBackgroundColorMap1({});
        drawAllLinesByDefault();
    }, [drawAllLinesByDefault, setIsHovering, setHoveredTokenIndex1]);

    const handleMouseOver2 = useCallback((renderedIndex: number): void => {
        if (!attentionData) return;
        setIsHovering(true);
        setHoveredTokenIndex2(renderedIndex);
    }, [attentionData, setIsHovering, setHoveredTokenIndex2]);

    const handleMouseOut2 = useCallback((): void => {
        setIsHovering(false);
        setHoveredTokenIndex2(null);
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

    const getFilteredTokens1 = (): string[] => {
        return attentionData?.tokens1.filter(token => token !== "[CLS]" && token !== "[SEP]") || [];
    };

    const getFilteredTokens2 = (): string[] => {
        return attentionData?.tokens2.filter(token => token !== "[CLS]" && token !== "[SEP]") || [];
    };

    useEffect(() => {
        if (isHovering && hoveredTokenIndex1 !== null && attentionData) {
            try {
                const filteredOriginalIndices1 = getFilteredOriginalIndices1();
                const filteredOriginalIndices2 = getFilteredOriginalIndices2();

                const originalIndex1 = filteredOriginalIndices1[hoveredTokenIndex1];
                if (originalIndex1 === undefined || originalIndex1 >= attentionData.attention_weights.length) return;

                const weights = attentionData.attention_weights[originalIndex1];
                const threshold: number = 0.1;
                const indicesToHighlight: number[] = [];
                const weightsToShow: number[] = [];
                const newBackgroundColorMap2: BackgroundColorMap = {};

                renderedTokens2.forEach((renderedToken2, index2) => {
                    if (renderedToken2 === "<br />" || renderedToken2 === "") return;
                    const originalIndex2 = filteredOriginalIndices2[index2];
                    if (originalIndex2 === undefined || originalIndex2 >= weights.length) return;

                    const filteredIndex2InWeights = filteredOriginalIndices2.indexOf(originalIndex2);
                    if (filteredIndex2InWeights !== -1 && filteredIndex2InWeights < weights.length) {
                        const weight = weights[filteredIndex2InWeights];
                        if (weight > threshold) {
                            indicesToHighlight.push(index2);
                            weightsToShow.push(weight);
                            newBackgroundColorMap2[originalIndex2] = getAttentionColor(weight);
                        }
                    }
                });

                const originalIndexHovered = filteredOriginalIndices1[hoveredTokenIndex1];
                const newBackgroundColorMap1: BackgroundColorMap = {};
                if (originalIndexHovered !== undefined) {
                    newBackgroundColorMap1[originalIndexHovered] = 'rgba(0, 0, 255, 0.3)';
                }

                setHighlightedIndices2(indicesToHighlight);
                setHighlightedIndices1([hoveredTokenIndex1]);
                setBackgroundColorMap2(newBackgroundColorMap2);
                setBackgroundColorMap1(newBackgroundColorMap1);

                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (canvas && ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawLines(hoveredTokenIndex1, 1, indicesToHighlight, 2, weightsToShow);
                }
            } catch (error) {
                console.error("Error handling mouse over in useEffect for token1:", error);
            }
        }
    }, [isHovering, hoveredTokenIndex1, attentionData, drawLines, getAttentionColor, getFilteredOriginalIndices1, getFilteredOriginalIndices2, renderedTokens2]);

    useEffect(() => {
        if (isHovering && hoveredTokenIndex2 !== null && attentionData) {
            try {
                const filteredOriginalIndices1 = getFilteredOriginalIndices1();
                const filteredOriginalIndices2 = getFilteredOriginalIndices2();

                const originalIndex2 = filteredOriginalIndices2[hoveredTokenIndex2];
                if (originalIndex2 === undefined) return;

                const weightIndex = attentionData.tokens1.length + originalIndex2;
                if (weightIndex >= attentionData.attention_weights.length) return;

                const weights = attentionData.attention_weights[weightIndex];
                const threshold: number = 0.1;
                const indicesToHighlight: number[] = [];
                const weightsToShow: number[] = [];
                const newBackgroundColorMap1: BackgroundColorMap = {};

                renderedTokens1.forEach((renderedToken1, index1) => {
                    if (renderedToken1 === "<br />" || renderedToken1 === "") return;
                    const originalIndex1 = filteredOriginalIndices1[index1];
                    if (originalIndex1 === undefined || originalIndex1 >= weights.length) return;

                    const filteredIndex1InWeights = filteredOriginalIndices1.indexOf(originalIndex1);
                    if (filteredIndex1InWeights !== -1 && filteredIndex1InWeights < weights.length) {
                        const weight = weights[filteredIndex1InWeights];
                        if (weight > threshold) {
                            indicesToHighlight.push(index1);
                            weightsToShow.push(weight);
                            newBackgroundColorMap1[originalIndex1] = getAttentionColor(weight);
                        }
                    }
                });

                const originalIndexHovered = filteredOriginalIndices2[hoveredTokenIndex2];
                const newBackgroundColorMap2: BackgroundColorMap = {};
                if (originalIndexHovered !== undefined) {
                    newBackgroundColorMap2[originalIndexHovered] = 'rgba(0, 0, 255, 0.3)';
                }

                setHighlightedIndices1(indicesToHighlight);
                setHighlightedIndices2([hoveredTokenIndex2]);
                setBackgroundColorMap1(newBackgroundColorMap1);
                setBackgroundColorMap2(newBackgroundColorMap2);

                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (canvas && ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawLines(hoveredTokenIndex2, 2, indicesToHighlight, 1, weightsToShow);
                }
            } catch (error) {
                console.error("Error handling mouse over in useEffect for token2:", error);
            }
        }
    }, [isHovering, hoveredTokenIndex2, attentionData, drawLines, getAttentionColor, getFilteredOriginalIndices1, getFilteredOriginalIndices2, renderedTokens1]);

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

            <div className="flex flex-row gap-4 w-full items-center">
                <div className='flex-1 border border-gray-300 p-4 font-mono max-h-fit overflow-auto whitespace-pre'>
                    <h2 className="text-lg font-semibold mb-2">Code Snippet 1</h2>
                    {isLoading ? (
                        <div>Loading tokens...</div>
                    ) : error ? (
                        <div>Error: {error}</div>
                    ) : renderedTokens1.filter(token => token !== "<br />").length === 0 ? (
                        <div>No tokens available</div>
                    ) : (
                        <div>
                            {renderedTokens1.map((renderedToken, index) => {
                                if (renderedToken === "<br />" || renderedToken === "") {
                                    return renderedToken === "<br />" ? <React.Fragment key={`token1-newline-${index}`}><br /></React.Fragment> : null;
                                }
                                const originalIndex = getFilteredOriginalIndices1()[index];
                                if (originalIndex === undefined) return null;

                                return (
                                    <span
                                        key={`token1-${originalIndex}`}
                                        ref={(el) => (tokens1Ref.current[index] = el)}
                                        className="cursor-pointer"
                                        onMouseOver={() => handleMouseOver1(index)}
                                        onMouseOut={handleMouseOut1}
                                        style={{
                                            backgroundColor: backgroundColorMap1[originalIndex] || 'transparent',
                                            transition: 'background-color 0.2s',
                                        }}
                                    >
                                        {renderedToken}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="flex-1 border border-gray-300 p-4 font-mono max-h-fit overflow-auto whitespace-pre">
                    <h2 className="text-lg font-semibold mb-2">Code Snippet 2</h2>
                    {isLoading ? (
                        <div>Loading tokens...</div>
                    ) : error ? (
                        <div>Error: {error}</div>
                    ) : renderedTokens2.filter(token => token !== "<br />").length === 0 ? (
                        <div>No tokens available</div>
                    ) : (
                        <div>
                            {renderedTokens2.map((renderedToken, index) => {
                                if (renderedToken === "<br />" || renderedToken === "") {
                                    return renderedToken === "<br />" ? <React.Fragment key={`token2-newline-${index}`}><br /></React.Fragment> : null;
                                }
                                const originalIndex = getFilteredOriginalIndices2()[index];
                                if (originalIndex === undefined) return null;

                                return (
                                    <span
                                        key={`token2-${originalIndex}`}
                                        ref={(el) => (tokens2Ref.current[index] = el)}
                                        className="cursor-pointer"
                                        onMouseOver={() => handleMouseOver2(index)}
                                        onMouseOut={handleMouseOut2}
                                        style={{
                                            backgroundColor: backgroundColorMap2[originalIndex] || 'transparent',
                                            transition: 'background-color 0.2s',
                                        }}
                                    >
                                        {renderedToken}
                                    </span>
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