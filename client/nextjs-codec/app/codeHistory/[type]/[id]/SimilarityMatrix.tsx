import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Editor from '@monaco-editor/react';
import { ArrowLeft } from 'lucide-react';

// Types
interface Snippet {
  learner_id: string;
  timestamp: string;
  code: string;
}

interface NodeData {
  id: number;
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
  matrix: number[][];
  snippets: Snippet[];
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
const SimilarityCard = React.memo(({ snippetId, similarity, onClick, snippet }: SimilarityCardProps) => {
  if (!snippet) return null;

  const colorClass = getSimilarityColor(similarity);

  return (
    <div
      onClick={() => onClick(snippetId)}
      className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-2 flex items-center justify-between cursor-pointer transition-colors duration-200 border border-transparent hover:border-gray-600"
    >
      <div className="flex flex-col text-left overflow-hidden">
        <span className="text-sm font-medium truncate text-white">
          {snippet.learner_id}
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

const SimilarityDashboard: React.FC<SimilarityDashboardProps> = ({ matrix, snippets }) => {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [isNodeLocked, setIsNodeLocked] = useState(false);
  const [selectedSnippetCode, setSelectedSnippetCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [graphPositions, setGraphPositions] = useState<GraphPositions | null>(null);
  const [showHighSimilaritySection, setShowHighSimilaritySection] = useState(true);
  const [selectedComparisonUserId, setSelectedComparisonUserId] = useState<string | null>(null);

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
    if (snippets?.length && !selectedNode) {
      setSelectedNode(0);
      setSelectedSnippetCode(snippets[0].code);
      setIsNodeLocked(true);
    }
  }, [snippets, selectedNode]);

  // Selected node connections
  const selectedNodeConnections = useMemo(() => {
    if (selectedNode === null || !links.length) return [];

    return links
      .filter(link => link.source === selectedNode || link.target === selectedNode)
      .sort((a, b) => b.similarity - a.similarity)
      .map(link => ({
        connectedNode: link.source === selectedNode ? link.target : link.source,
        similarity: link.similarity
      }));
  }, [selectedNode, links]);

  const handleNodeClick = useCallback((nodeId: number) => {
    if (!snippets[nodeId]) return;

    setSelectedNode(prev => {
      if (prev === nodeId && isNodeLocked) {
        setIsNodeLocked(false);
        setSelectedSnippetCode(null);
        return null;
      }
      setIsNodeLocked(true);
      setSelectedSnippetCode(snippets[nodeId].code);
      setShowHighSimilaritySection(false); // Close high similarity section
      return nodeId;
    });
  }, [isNodeLocked, snippets]);

  const handleNodeHover = useCallback((nodeId: number) => {
    if (!isNodeLocked && snippets[nodeId]) {
      setSelectedNode(nodeId);
      setSelectedSnippetCode(snippets[nodeId].code);
      setShowHighSimilaritySection(false); // Close high similarity section
    }
  }, [isNodeLocked, snippets]);

  const handleSnippetClick = useCallback((snippetId: number) => {
    if (snippets[snippetId]) {
      setSelectedSnippetCode(snippets[snippetId].code);
      setSelectedComparisonUserId(snippets[snippetId].learner_id);
    }
  }, [snippets]);

  // Initialize simulation
  useEffect(() => {
    if (!matrix?.length || !snippets?.length) return;
    setIsLoading(true);

    const nodeData: NodeData[] = snippets.map((snippet, index) => ({
      id: index,
      learner_id: snippet.learner_id,
      timestamp: snippet.timestamp,
      x: Math.random() * (width - 2 * nodeRadius) + nodeRadius,
      y: Math.random() * (height - 2 * nodeRadius) + nodeRadius,
      vx: 0,
      vy: 0
    }));

    const linkData: LinkData[] = [];
    matrix.forEach((row, i) => {
      row.forEach((similarity, j) => {
        if (i < j && similarity >= 60) {
          linkData.push({
            source: i,
            target: j,
            similarity
          });
        }
      });
    });

    setNodes(nodeData);
    setLinks(linkData);

    let rafId: number;
    let isActive = true;
    let iteration = 0;
    const maxIterations = 200;

    const simulate = () => {
      if (!isActive || iteration >= maxIterations) return;
      iteration++;

      let totalMovement = 0;
      nodeData.forEach((node1, i) => {
        nodeData.forEach((node2, j) => {
          if (i < j) {
            const dx = node2.x - node1.x;
            const dy = node2.y - node1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < nodeSpacing) {
              const force = (nodeSpacing - distance) / distance;
              const moveX = dx * force * forceStrength;
              const moveY = dy * force * forceStrength;

              node1.vx -= moveX;
              node1.vy -= moveY;
              node2.vx += moveX;
              node2.vy += moveY;

              totalMovement += Math.abs(moveX) + Math.abs(moveY);
            }
          }
        });

        linkData.forEach(link => {
          if (link.source === i || link.target === i) {
            const other = nodeData[link.source === i ? link.target : link.source];
            const dx = other.x - node1.x;
            const dy = other.y - node1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const force = (distance - nodeSpacing) / distance;
            const similarity = link.similarity / 100;

            const moveX = dx * force * forceStrength * similarity;
            const moveY = dy * force * forceStrength * similarity;

            node1.vx += moveX;
            node1.vy += moveY;
          }
        });

        node1.x += node1.vx;
        node1.y += node1.vy;
        node1.vx *= 0.8;
        node1.vy *= 0.8;

        node1.x = Math.max(nodeRadius, Math.min(width - nodeRadius, node1.x));
        node1.y = Math.max(nodeRadius, Math.min(height - nodeRadius, node1.y));
      });

      setGraphPositions({
        nodes: nodeData.map(node => ({ x: node.x, y: node.y })),
        timestamp: Date.now()
      });

      if (totalMovement < 0.1 || iteration >= maxIterations) {
        isActive = false;
      } else {
        rafId = requestAnimationFrame(simulate);
      }
    };

    rafId = requestAnimationFrame(simulate);
    setIsLoading(false);

    return () => {
      isActive = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [matrix, snippets, width, height, nodeRadius, forceStrength, nodeSpacing]);

  // Render function for nodes
  const renderNode = useCallback((node: NodeData, i: number, isSelected: boolean) => {
    const baseColor = getSimilarityColor(0);
    const nodeColor = isSelected ? '#3b82f6' : baseColor.hex;
    const learner_id = node.learner_id.length > 20 ? `${node.learner_id.slice(0, 18)}...` : node.learner_id;
    const position = graphPositions?.nodes[i] || node;

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
          {learner_id}
        </text>
      </g>
    );
  }, [graphPositions, handleNodeClick, handleNodeHover, nodeRadius]);

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
        onClick={() => setShowHighSimilaritySection(prev => !prev)}
      >
        <h4 className="text-xs font-medium mb-1">High Similarity</h4>
        <div className="text-xl font-bold">
          {getHighSimilarityPairs(matrix, snippets).length}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="bg-gray-800 border-0">
      <CardHeader>
        {/* <CardTitle className="text-xl font-semibold">Similarity Analysis Dashboard</CardTitle> */}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Left column: Graph */}
          <div className="relative">
            <div className="bg-gray-900 rounded-lg p-4">
              <svg width={width} height={height}>
                {links.map((link, i) => {
                  const source = nodes[link.source];
                  const target = nodes[link.target];
                  const selected = selectedNode === link.source || selectedNode === link.target;
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
                      opacity={selectedNode === null || selected ? 0.6 : 0.2}
                    />
                  ) : null;
                })}

                {nodes.map((node, i) => renderNode(node, i, selectedNode === i))}
              </svg>

              <div className="absolute top-4 right-4 bg-gray-800 p-3 rounded-lg shadow-lg">
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
              </div>
            </div>
          </div>

          {/* Right column: Stats + Connections */}
          <div className="space-y-4">
            {/* Statistics section */}
            <StatsSection />

            {/* Connections or High Similarity section */}
            {selectedNode !== null && !showHighSimilaritySection && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium mb-3">
                  Connections for {snippets[selectedNode]?.learner_id}'s Submission
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {selectedNodeConnections.map((conn, i) => (
                    <SimilarityCard
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
            {showHighSimilaritySection && (
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">High Similarity Pairs</h4>
                  <button
                    onClick={() => setShowHighSimilaritySection(false)}
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
                        setSelectedNode(pair.target);
                      }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm truncate max-w-[70%]">
                          {snippets[pair.source].learner_id} & {snippets[pair.target].learner_id}
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

        {!isLoading && (
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-2">
                {selectedNode !== null && snippets[selectedNode]
                  ? `${snippets[selectedNode].learner_id}'s Code`
                  : 'Reference File'
                }
              </h4>
              <Editor
                height="300px"
                language="javascript"
                theme="vs-dark"
                value={selectedNode !== null && snippets[selectedNode]
                  ? snippets[selectedNode].code
                  : "// Select a node to view its code"
                }
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false
                }}
              />
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-2">
                {selectedComparisonUserId
                  ? `${selectedComparisonUserId}'s Code`
                  : "Select a snippet to compare"
                }
              </h4>
              <Editor
                height="300px"
                language="javascript"
                theme="vs-dark"
                value={selectedSnippetCode || "// Select a snippet to view its code"}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(SimilarityDashboard);