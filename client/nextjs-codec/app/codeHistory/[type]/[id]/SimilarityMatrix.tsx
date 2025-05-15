import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CodeComparison from './CodeComparison';
import { ArrowLeft } from 'lucide-react';
import * as d3 from 'd3';
import DraggableLegend from '@/components/ui/draggable';

// Types
interface Snippet {
  learner: string;
  learner_id: string;
  timestamp: string;
  code: string;
}

interface NodeData {
  id: number;
  learner: string;
  learner_id: string;
  timestamp: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface LinkData {
  source: number;
  target: number;
  similarity: number;
}

interface GraphPositions {
  nodes: Array<{ x: number; y: number }>;
  timestamp: number;
}

interface SimilarityCardProps {
  anonymize: boolean;
  snippetId: number;
  similarity: number;
  onClick: (id: number) => void;
  snippet: Snippet;
}

interface HighSimilarityPair {
  user1: string;
  user2: string;
  similarity: number;
}

interface SimilarityDashboardProps {
  anonymize: boolean;
  matrix: number[][];
  snippets: Snippet[];
}

interface SimilarStructure {
  cluster_id: number;
  type: string;
  similarity: number;
  code_a: string[];
  code_b: string[];
}

// Add this interface to your file
interface MyNodeDatum extends d3.SimulationNodeDatum {
  id: number; // Changed from string to number
  learner?: string;
  learner_id?: string;
  timestamp?: string;
  // Other optional properties
  similarity?: number;
}

// Helper functions
const getSimilarityColor = (similarity: number) => {
  if (similarity >= 80) return { bg: 'bg-red-600', text: 'text-white', hex: '#dc2626' };
  if (similarity >= 60) return { bg: 'bg-yellow-600', text: 'text-white', hex: '#ca8a04' };
  return { bg: 'bg-blue-600', text: 'text-white', hex: '#2563eb' };
};

const getColorForSimilarity = (similarity: number) => {
  if (similarity >= 80) return 'bg-red-600 text-white';
  if (similarity >= 60) return 'bg-yellow-600 text-white';
  return 'bg-gray-700';
};

// Add getHighSimilarityPairs helper function after other helper functions
const getHighSimilarityPairs = (matrix: number[][], snippets: Snippet[]) => {
  const pairs: Array<{ source: number, target: number, similarity: number }> = [];
  matrix.forEach((row, i) => {
    row.forEach((similarity, j) => {
      if (i < j && similarity >= 80) {
        pairs.push({
          source: i,
          target: j,
          similarity
        });
      }
    });
  });
  return pairs.sort((a, b) => b.similarity - a.similarity);
};

// Memoized SimilarityCard component
const SimilarityCard = React.memo(({ snippetId, similarity, onClick, snippet, anonymize }: SimilarityCardProps) => {
  if (!snippet) return null;

  const colorClass = getSimilarityColor(similarity);

  return (
    <div
      onClick={() => onClick(snippetId)}
      className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-2 flex items-center justify-between cursor-pointer transition-colors duration-200 border border-transparent hover:border-gray-600"
    >
      <div className="flex flex-col text-left overflow-hidden">
        <span className="text-sm font-medium truncate text-white">
          {anonymize ? 'Leaner' : snippet.learner}
        </span>
        <span className="text-xs text-gray-400 truncate">
          {new Date(snippet.timestamp).toLocaleString()}
        </span>
      </div>
      <Badge className={`${colorClass.bg} text-xs ml-2 whitespace-nowrap`}>
        {similarity.toFixed(1)}%
      </Badge>
    </div>
  );
});

SimilarityCard.displayName = 'SimilarityCard';

const SimilarityDashboard: React.FC<SimilarityDashboardProps> = ({ anonymize = false, matrix, snippets }) => {
  const [graphData, setGraphData] = useState({
    nodes: [] as NodeData[],
    links: [] as LinkData[],
    positions: null as GraphPositions | null,
    isLoading: true
  });

  const [selection, setSelection] = useState({
    nodeId: null as number | null,
    isLocked: false,
    comparisonUserId: null as string | null,
    snippetCode: null as string | null
  });

  const [uiState, setUiState] = useState({
    showHighSimilaritySection: true,
    isHighlightingCode: false,
    structures: [] as SimilarStructure[]
  });

  const width = 500;
  const height = 400;
  const forceStrength = 0.05;
  const nodeSpacing = 150;

  // Calculate dynamic node radius based on number of nodes
  const nodeRadius = useMemo(() => {
    const baseRadius = 30;
    const scaleFactor = Math.max(0.5, Math.min(1, 20 / snippets.length));
    return baseRadius * scaleFactor;
  }, [snippets.length]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!matrix) return { avg: 0, total: 0, highSimCount: 0 };

    let sum = 0;
    let count = 0;
    let highSimCount = 0;

    matrix.forEach((row, i) => {
      row.forEach((value, j) => {
        if (i < j) {
          sum += value;
          count++;
          if (value >= 80) {
            highSimCount++;
          }
        }
      });
    });

    return {
      avg: count > 0 ? sum / count : 0,
      total: snippets.length,
      highSimCount
    };
  }, [matrix, snippets.length]);

  // Initialize with first node selected
  useEffect(() => {
    if (snippets?.length && !selection.nodeId) {
      setSelection({
        nodeId: 0,
        isLocked: true,
        snippetCode: snippets[0].code,
        comparisonUserId: snippets[0].learner
      });
    }
  }, [snippets, selection.nodeId]);

  // Selected node connections
  const selectedNodeConnections = useMemo(() => {
    if (selection.nodeId === null || !graphData.links.length) return [];

    return graphData.links
      .filter(link => {
        const sourceId = typeof link.source === 'number'
          ? link.source
          : (link.source as any).id;
        const targetId = typeof link.target === 'number'
          ? link.target
          : (link.target as any).id;
        return sourceId === selection.nodeId || targetId === selection.nodeId;
      })
      .sort((a, b) => b.similarity - a.similarity)
      .map(link => {
        const sourceId = typeof link.source === 'number'
          ? link.source
          : (link.source as any).id;
        const targetId = typeof link.target === 'number'
          ? link.target
          : (link.target as any).id;
        return {
          connectedNode: sourceId === selection.nodeId ? targetId : sourceId,
          similarity: link.similarity
        };
      });
  }, [selection.nodeId, graphData.links]);

  const handleNodeClick = useCallback((nodeId: number) => {
    if (!snippets[nodeId]) return;

    setSelection(prev => {
      if (prev.nodeId === nodeId && prev.isLocked) {
        return {
          ...prev,
          nodeId: null,
          isLocked: false,
          snippetCode: null
        };
      }
      return {
        ...prev,
        nodeId: nodeId,
        isLocked: true,
        snippetCode: snippets[nodeId].code
      };
    });

    setUiState(prev => ({
      ...prev,
      showHighSimilaritySection: false
    }));
  }, [snippets]);

  const handleNodeHover = useCallback((nodeId: number) => {
    if (!selection.isLocked && snippets[nodeId]) {
      setSelection(prev => ({
        ...prev,
        nodeId: nodeId,
        snippetCode: snippets[nodeId].code
      }));

      setUiState(prev => ({
        ...prev,
        showHighSimilaritySection: false
      }));
    }
  }, [selection.isLocked, snippets]);

  const handleSnippetClick = useCallback((snippetId: number) => {
    if (snippets[snippetId]) {
      // Clear structures to reset any previous comparison
      setUiState(prev => ({
        ...prev,
        structures: []
      }));

      // Update selection state
      setSelection(prev => ({
        ...prev,
        snippetCode: snippets[snippetId].code,
        comparisonUserId: snippets[snippetId].learner
      }));

      // Log to verify state updates are happening
      console.log(`Selected comparison: ${snippets[snippetId].learner}`);
    }
  }, [snippets]);

  // Debug useEffect for highlight button conditions
  useEffect(() => {
    console.log("Highlight button conditions changed:");
    console.log("- isHighlightingCode:", uiState.isHighlightingCode);
    console.log("- selection.nodeId:", selection.nodeId);
    console.log("- selection.snippetCode:", selection.snippetCode ? "exists" : "null");

    const isSameCode = selection.nodeId !== null &&
      snippets[selection.nodeId] &&
      snippets[selection.nodeId].code === selection.snippetCode;
    console.log("- Same code:", isSameCode);

    const isSameUser = selection.nodeId !== null &&
      snippets[selection.nodeId] &&
      snippets[selection.nodeId].learner_id === selection.comparisonUserId;
    console.log("- Same user:", isSameUser);

    const buttonDisabled = uiState.isHighlightingCode ||
      !selection.nodeId ||
      !selection.snippetCode ||
      (isSameCode && isSameUser);
    console.log("- Button disabled:", buttonDisabled);
  }, [
    uiState.isHighlightingCode,
    selection.nodeId,
    selection.snippetCode,
    selection.comparisonUserId,
    snippets
  ]);

  // Replace custom simulation with D3
  useEffect(() => {
    if (!matrix?.length || !snippets?.length) return;
    setGraphData(prev => ({ ...prev, isLoading: true }));

    const nodeData = snippets.map((snippet, index) => ({
      id: index,
      learner: snippet.learner,
      learner_id: snippet.learner,
      timestamp: snippet.timestamp,
      x: width / 2, // D3 will handle positioning
      y: height / 2,
      vx: 0,
      vy: 0
    }));

    const linkData: (any) = [];
    const linkDataWithIndices = matrix.forEach((row, i) => {
      row.forEach((similarity, j) => {
        if (i < j && similarity >= 60) {
          linkData.push({
            sourceIndex: i, // Store original numeric indices
            targetIndex: j,
            source: i,      // These will be modified by D3
            target: j,
            similarity
          });
        }
      });
    });

    setGraphData(prev => ({
      ...prev,
      nodes: nodeData,
      links: linkData
    }));

    // Create D3 force simulation
    const simulation = d3.forceSimulation<MyNodeDatum>(nodeData as MyNodeDatum[])
      .force('link', d3.forceLink<MyNodeDatum, any>(linkData)
        .id((d: { id: any; }) => d.id)
        .strength((d: { similarity: number; }) => d.similarity ? d.similarity / 100 : 0))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(nodeRadius * 1.5))
      .on('tick', () => {
        // Contain nodes within bounds
        nodeData.forEach(node => {
          node.x = Math.max(nodeRadius, Math.min(width - nodeRadius, node.x));
          node.y = Math.max(nodeRadius, Math.min(height - nodeRadius, node.y));
        });

        setGraphData(prev => ({
          ...prev,
          nodes: [...nodeData], // Create new reference to trigger re-render
          links: linkData,
          positions: {
            nodes: nodeData.map(node => ({ x: node.x, y: node.y })),
            timestamp: Date.now()
          },
          isLoading: false
        }));
      });

    // Add alpha decay to make simulation settle faster
    simulation.alphaDecay(0.02);

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [matrix, snippets, width, height, nodeRadius]);

  // Render function for nodes
  const renderNode = useCallback((node: NodeData, i: number, isSelected: boolean, anonymize: boolean) => {
    const baseColor = getSimilarityColor(0);
    const nodeColor = isSelected ? '#3b82f6' : baseColor.hex;
    const learner = node.learner;
    const position = graphData.positions?.nodes[i] || node;

    return (
      <g key={i}>
        <circle
          cx={position.x}
          cy={position.y}
          r={nodeRadius}
          fill={nodeColor}
          stroke={isSelected ? '#ffffff' : 'none'}
          strokeWidth={2}
          opacity={0.8}
          cursor="pointer"
          onClick={() => handleNodeClick(i)}
          onMouseEnter={() => handleNodeHover(i)}
        />
        <text
          x={position.x}
          y={position.y}
          dy=".35em"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="10"
          className="select-none"
        >
          {anonymize ? 'Learner' : learner}
        </text>
      </g>
    );
  }, [graphData.positions, handleNodeClick, handleNodeHover, nodeRadius]);

  if (!matrix || !snippets) {
    return <div>No data available</div>;
  }
  const StatsSection = () => (
    <div className="grid grid-cols-3 gap-2">
      <div className={`p-3 rounded-lg ${getColorForSimilarity(stats.avg)}`}>
        <h4 className="text-xs font-medium mb-1">Average Similarity</h4>
        <div className="text-xl font-bold">
          {stats.avg.toFixed(1)}%
        </div>
      </div>
      <div className="p-3 bg-gray-700 rounded-lg">
        <h4 className="text-xs font-medium mb-1">Total Submissions</h4>
        <div className="text-xl font-bold">{stats.total}</div>
      </div>
      <div
        className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
        onClick={() => setUiState(prev => ({ ...prev, showHighSimilaritySection: !prev.showHighSimilaritySection }))}
      >
        <h4 className="text-xs font-medium mb-1">High Similarity</h4>
        <div className="text-xl font-bold">
          {getHighSimilarityPairs(matrix, snippets).length}
        </div>
      </div>
    </div>
  );

  const highlightCode = async () => {
    setUiState(prev => ({
      ...prev,
      isHighlightingCode: true
    }));

    console.log("highlight code requested")
    if (!selection.nodeId === null || !selection.snippetCode) return;

    const API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || 'https://codecflaskapi.duckdns.org';
    // const API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000';
    try {
      const structuralResponse = await fetch(`${API_URL}/api/visualize-similarity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code1: selection.nodeId !== null ? snippets[selection.nodeId].code.trim() : "",
          code2: selection.snippetCode.trim()
        }),
      })

      const structuralData = await structuralResponse.json();
      if (!structuralResponse.ok) {
        throw new Error('Failed to fetch structural data');
      }

      if (structuralData.success) {
        setUiState(prev => ({
          ...prev,
          structures: structuralData.structures
        }));
      } else {
        throw new Error(structuralData.error || 'Structural analysis failed');
      }
    } catch {
      console.error('Error fetching structural data');
    } finally {
      setUiState(prev => ({
        ...prev,
        isHighlightingCode: false
      }));
    }
  }


  return (
    <Card className="bg-gray-800 border-0">
      <CardContent>
        <div className="grid grid-cols-2 gap-6 pt-8">
          {/* Left column: Graph */}
          <div className="relative">
            <div className="bg-gray-900 rounded-lg p-4 h-full relative">
              <svg width={width} height={height}>
                {/* ...existing SVG content... */}
                {graphData.links.map((link: any, i) => {
                  const source = graphData.nodes[link.sourceIndex];
                  const target = graphData.nodes[link.targetIndex];
                  const selected = selection.nodeId === link.sourceIndex || selection.nodeId === link.targetIndex;
                  const color = getSimilarityColor(link.similarity).hex;

                  return source && target ? (
                    <line
                      key={i}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={color}
                      strokeWidth={selected ? 3 : 1}
                      opacity={selection.nodeId === null || selected ? 0.6 : 0.2}
                    />
                  ) : null;
                })}

                {graphData.nodes.map((node, i) => renderNode(node, i, selection.nodeId === i, anonymize))}
              </svg>

              <DraggableLegend
                className="p-3 bg-gray-800 rounded-lg"
                initialPosition={{ x: width - 150, y: 20 }}
              >
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-600" />
                    <span>≥80% Similar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-600" />
                    <span>≥60% Similar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <span>Selected User</span>
                  </div>
                </div>
              </DraggableLegend>
            </div>
          </div>

          {/* Right column: Stats + Connections */}
          <div className="space-y-4">
            {/* Statistics section */}
            <StatsSection />

            {/* Connections or High Similarity section */}
            {selection.nodeId !== null && !uiState.showHighSimilaritySection && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium mb-3">
                  Connections for {snippets[selection.nodeId]?.learner}&apos;s Submission
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {selectedNodeConnections.map((conn, i) => (
                    <SimilarityCard
                      anonymize={anonymize}
                      key={i}
                      snippetId={conn.connectedNode}
                      similarity={conn.similarity}
                      onClick={handleSnippetClick}
                      snippet={snippets[conn.connectedNode]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* High Similarity Section */}
            {uiState.showHighSimilaritySection && (
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">High Similarity Pairs</h4>
                  <button
                    onClick={() => setUiState(prev => ({ ...prev, showHighSimilaritySection: false }))}
                    className="p-1 hover:bg-gray-600 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {getHighSimilarityPairs(matrix, snippets).map((pair, i) => (
                    <div
                      key={i}
                      className="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-750"
                      onClick={() => {
                        handleSnippetClick(pair.source);
                        setSelection(prev => ({
                          ...prev,
                          nodeId: pair.target
                        }));
                      }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm truncate max-w-[70%]">
                          {anonymize ?
                            'Learner1 & Learner2'
                            :
                            `${snippets[pair.source].learner} & ${snippets[pair.target].learner}`
                          }

                        </span>
                        <Badge className={getColorForSimilarity(pair.similarity)}>
                          {pair.similarity.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {!graphData.isLoading && (
          <div className="gap-6 mt-6 flex flex-col">
            {/* Code comparison section */}
            <div className="bg-gray-700 rounded-lg p-4 mt-4">

              <CodeComparison
                anonymize={anonymize}
                code1={selection.nodeId !== null && snippets[selection.nodeId]
                  ? snippets[selection.nodeId].code
                  : "// Select a node to view its code"
                }
                code2={selection.snippetCode || "// Select a snippet to view its code"}
                learner1Id={selection.nodeId !== null && snippets[selection.nodeId]
                  ? `${snippets[selection.nodeId].learner}'s Code`
                  : 'Reference File'
                }
                learner2Id={selection.comparisonUserId
                  ? `${selection.comparisonUserId}'s Code`
                  : "Select a snippet to compare"
                }
                structures={uiState.structures || []}
                onButtonClick={highlightCode}
                disableButton={
                  uiState.isHighlightingCode ||
                  !selection.nodeId === null ||
                  !selection.snippetCode ||
                  (selection.nodeId !== null &&
                    snippets[selection.nodeId] &&
                    snippets[selection.nodeId].code === selection.snippetCode &&
                    snippets[selection.nodeId].learner_id === selection.comparisonUserId)
                }
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(SimilarityDashboard);