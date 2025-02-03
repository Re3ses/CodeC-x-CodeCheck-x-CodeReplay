import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Info, Clipboard } from 'lucide-react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
// import { Dialog } from '@headlessui/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';


import Editor from '@monaco-editor/react';

interface CodeSnapshot {
  code: string;
  timestamp: string;
  userId: string;
}

interface SequentialSimilarity {
  fromIndex: number;
  toIndex: number;
  similarity: number;
  codebertScore: number;
}

interface EnhancedPasteInfo {
  text: string;
  fullCode: string;
  timestamp: string;
  length: number;
  contextRange: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

// Update the props interface:
interface SequentialSimilarityVisualizationProps {
  snapshots: CodeSnapshot[];
  sequentialSimilarities: SequentialSimilarity[];
  pasteCount: number;
  bigPasteCount: number;
  pastedSnippets: EnhancedPasteInfo[];
}

const SequentialSimilarityVisualization: React.FC<SequentialSimilarityVisualizationProps> = ({
  snapshots,
  sequentialSimilarities,
  pasteCount,
  bigPasteCount,
  pastedSnippets
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localPastedSnippets, setLocalPastedSnippets] = useState<PasteInfo[]>([]);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);

  const toggleCard = (index: number) => {
    setExpandedCards(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Add useEffect to log and set local state for snippets
  useEffect(() => {
    console.log('Received Paste Snippets:', pastedSnippets);
    if (pastedSnippets && pastedSnippets.length > 0) {
      setLocalPastedSnippets(pastedSnippets);
    }
  }, [pastedSnippets]);

  // Compute advanced metrics
  const advancedMetrics = useMemo(() => {
    if (sequentialSimilarities.length === 0) return null;

    // Extract CSS values
    const cssValues = sequentialSimilarities.map(s => s.similarity);

    // Max Change
    const changes = cssValues.slice(1).map((val, i) =>
      Math.abs(val - cssValues[i])
    );
    const maxChange = Math.max(...changes);
    const maxChangePct = (maxChange / Math.max(...cssValues)) * 100;

    // Average Similarity
    const averageSimilarity = cssValues.reduce((a, b) => a + b, 0) / cssValues.length;

    // Minimum Similarity
    const minSimilarity = Math.min(...cssValues);

    // Variance Calculation 
    const mean = averageSimilarity;
    const variance = Math.min(
      cssValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / cssValues.length
    );
    const normalizedVariance = (variance / 2500) * 100;

    // Weighted Plagiarism Score
    const weightedScore =
      (maxChange) * 0.4 +
      (100 - averageSimilarity) * 0.2 +
      (100 - minSimilarity) * 0.2 +
      (normalizedVariance) * 0.2;

    return {
      maxChange: Math.round(maxChange),
      maxChangePct: Math.round(maxChangePct),
      averageSimilarity: Math.round(averageSimilarity),
      minSimilarity: Math.round(minSimilarity),
      variance: Math.round(variance),
      normalizedVariance: Math.round(normalizedVariance),
      weightedPlagiarismScore: Math.round(weightedScore)
    };
  }, [sequentialSimilarities]);

  // Prepare data for the chart
  const chartData = sequentialSimilarities.map((similarity, index) => ({
    name: `Snapshot ${similarity.fromIndex + 1} to ${similarity.toIndex + 1}`,
    similarity: similarity.similarity,
    codebertScore: similarity.codebertScore
  }));

  // Determine plagiarism risk level and color
  const getPlagiarismRiskDetails = (score: number) => {
    if (score <= 40) return {
      level: 'Low Probability',
      color: 'bg-green-600 text-white',
      textColor: 'text-green-600'
    };
    if (score <= 60) return {
      level: 'Medium Probability',
      color: 'bg-yellow-600 text-white',
      textColor: 'text-yellow-600'
    };
    if (score <= 80) return {
      level: 'High Probability',
      color: 'bg-orange-600 text-white',
      textColor: 'text-orange-600'
    };
    return {
      level: 'Very High Probability',
      color: 'bg-red-600 text-white',
      textColor: 'text-red-600'
    };
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        Sequential Similarity Analysis
      </h3>

      {sequentialSimilarities.length === 0 ? (
        <div className="text-gray-400">
          No sequential similarities calculated yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart Column */}
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1F2937', color: '#fff' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="similarity"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Graph Analysis Description */}
            <div className="mt-4 bg-gray-700 rounded-lg p-4 shadow-lg">
              <div className="flex items-center mb-3">
                <Info className="text-gray-400 mr-2" size={18} />
                <h4 className="text-md font-semibold text-gray-200">
                  How to Analyze the Graph
                </h4>
              </div>
              <div className="text-gray-400 text-sm">
                <p>
                  The graph above shows the similarity between consecutive code snapshots.
                  The more the line deviates from a straight line, the more inconsistent
                  the similarity scores are, which could indicate a higher chance of plagiarism.
                </p>
              </div>
            </div>
          </div>

          {/* Metrics Column */}
          <div className="space-y-4">
            {advancedMetrics && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-4">Advanced Similarity Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Plagiarism Risk Indicator */}
                  {(() => {
                    const plagiarismRisk = getPlagiarismRiskDetails(advancedMetrics.weightedPlagiarismScore);
                    return (
                      <div className={`
                        col-span-2 p-4 rounded-lg text-center 
                        ${plagiarismRisk.color} 
                        transform transition-all hover:scale-105
                      `}>
                        <div className="text-xs uppercase tracking-wide mb-1">Plagiarism Risk</div>
                        <div className="text-4xl font-bold mb-2">
                          {advancedMetrics.weightedPlagiarismScore}%
                        </div>
                        <div className="text-lg font-semibold">
                          {plagiarismRisk.level}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Metric Cards */}
                  <MetricCard
                    label="Max Change"
                    value={`${advancedMetrics.maxChange}%`}
                    tooltipId="maxChangeTooltip"
                    tooltipContent="Maximum difference in similarity between consecutive snapshots"
                  />
                  <MetricCard
                    label="Average Similarity"
                    value={`${advancedMetrics.averageSimilarity}%`}
                    tooltipId="averageSimilarityTooltip"
                    tooltipContent="Mean value of all similarity scores"
                  />
                  <MetricCard
                    label="Minimum Similarity"
                    value={`${advancedMetrics.minSimilarity}%`}
                    tooltipId="minSimilarityTooltip"
                    tooltipContent="Lowest similarity score observed"
                  />
                  <MetricCard
                    label="Variance"
                    value={`${advancedMetrics.normalizedVariance}%`}
                    tooltipId="varianceTooltip"
                    tooltipContent="Measure of similarity score fluctuation"
                  />
                </div>

                {/* Paste Statistics */}
                <div className="mt-4 flex items-center justify-between bg-gray-600 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Clipboard className="mr-2 text-gray-400" size={20} />
                    <span className="text-gray-200 font-semibold">
                      Total Pastes: {pasteCount}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clipboard className="mr-2 text-gray-400" size={20} />
                    <span className="text-gray-200 font-semibold">
                      Big Pastes: {bigPasteCount}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    View Pasted Snippets
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tooltips */}
      <ReactTooltip id="maxChangeTooltip" place="top" effect="solid" />
      <ReactTooltip id="averageSimilarityTooltip" place="top" effect="solid" />
      <ReactTooltip id="minSimilarityTooltip" place="top" effect="solid" />
      <ReactTooltip id="varianceTooltip" place="top" effect="solid" />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pasted Snippets ({localPastedSnippets.length})</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {localPastedSnippets.length === 0 ? (
              <div className="text-gray-400">No pasted snippets found.</div>
            ) : (
              <div className="space-y-4">
                {localPastedSnippets.map((snippet, index) => (
                  <div
                    key={index}
                    className="bg-gray-700 rounded-lg overflow-hidden"
                  >
                    {/* Collapsible Card Header - Always Visible */}
                    <button
                      onClick={() => toggleCard(index)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-600 transition-colors"
                    >
                      <div>
                        <div className="font-semibold">Paste {index + 1}</div>
                        <div className="text-sm text-gray-400">
                          {new Date(snippet.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {snippet.length} characters at line {snippet.contextRange.startLine}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">
                          {expandedCards.includes(index) ? 'Hide Details' : 'Show Details'}
                        </span>
                        <svg
                          className={`w-5 h-5 transform transition-transform ${expandedCards.includes(index) ? 'rotate-180' : ''
                            }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {expandedCards.includes(index) && (
                      <div className="border-t border-gray-600 p-4">
                        <div className="mt-2">
                          <div className="text-sm font-semibold mb-2">Code Context:</div>
                          <Editor
                            height="200px"
                            defaultLanguage="javascript"
                            value={snippet.fullCode}
                            theme="vs-dark"
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              fontSize: 12,
                              scrollBeyondLastLine: false,
                              wordWrap: 'on',
                              renderLineHighlight: 'none',
                              hideCursorInOverviewRuler: true,
                              overviewRulerBorder: false,
                            }}
                            onMount={(editor) => {
                              const decoration = {
                                range: new (window as any).monaco.Range(
                                  snippet.contextRange.startLine,
                                  snippet.contextRange.startColumn,
                                  snippet.contextRange.endLine,
                                  snippet.contextRange.endColumn
                                ),
                                options: {
                                  inlineClassName: 'bg-yellow-500 bg-opacity-20',
                                  isWholeLine: false,
                                  overviewRuler: {
                                    color: '#ffd700',
                                    position: 1
                                  }
                                }
                              };
                              editor.createDecorationsCollection([decoration]);

                              setTimeout(() => {
                                editor.revealLineInCenter(snippet.contextRange.startLine);
                              }, 100);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pasted Snippets Modal */}
      {/* <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-4xl rounded-lg bg-gray-800 p-6 max-h-[80vh] flex flex-col">
            <Dialog.Title className="text-lg font-semibold mb-4 sticky top-0 bg-gray-800">
              Pasted Snippets ({localPastedSnippets.length})
            </Dialog.Title>
            
            <div className="flex-1 overflow-y-auto pr-2">
              {localPastedSnippets.length === 0 ? (
                <div className="text-gray-400">No pasted snippets found.</div>
              ) : (
                <div className="space-y-4">
                  {localPastedSnippets.map((snippet, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-700 rounded-lg overflow-hidden"
                    > */}
      {/* Collapsible Card Header - Always Visible */}
      {/* <button
                        onClick={() => toggleCard(index)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-600 transition-colors"
                      >
                        <div>
                          <div className="font-semibold">Paste {index + 1}</div>
                          <div className="text-sm text-gray-400">
                            {new Date(snippet.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          {snippet.length} characters at line {snippet.contextRange.startLine}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">
                            {expandedCards.includes(index) ? 'Hide Details' : 'Show Details'}
                          </span>
                          <svg
                            className={`w-5 h-5 transform transition-transform ${
                              expandedCards.includes(index) ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button> */}

      {/* Expanded Content */}
      {/* {expandedCards.includes(index) && (
                        <div className="border-t border-gray-600 p-4"> */}
      {/* Full Context Editor */}
      {/* <div className="mt-2">
                            <div className="text-sm font-semibold mb-2">Code Context:</div>
                            <Editor
                              height="200px"
                              defaultLanguage="javascript"
                              value={snippet.fullCode}
                              theme="vs-dark"
                              options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 12,
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                renderLineHighlight: 'none',
                                hideCursorInOverviewRuler: true,
                                overviewRulerBorder: false,
                              }}
                              onMount={(editor) => {
                                const decoration = {
                                  range: new (window as any).monaco.Range(
                                    snippet.contextRange.startLine,
                                    snippet.contextRange.startColumn,
                                    snippet.contextRange.endLine,
                                    snippet.contextRange.endColumn
                                  ),
                                  options: {
                                    inlineClassName: 'bg-yellow-500 bg-opacity-20',
                                    isWholeLine: false,
                                    overviewRuler: {
                                      color: '#ffd700',
                                      position: 1
                                    }
                                  }
                                };
                                editor.createDecorationsCollection([decoration]);
                                
                                // Scroll to the pasted region
                                setTimeout(() => {
                                  editor.revealLineInCenter(snippet.contextRange.startLine);
                                }, 100);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 sticky bottom-0 bg-gray-800 pt-2">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog> */}
    </div>
  );
};

// Helper component with tooltip integration
const MetricCard: React.FC<{
  label: string;
  value: string;
  tooltipId: string;
  tooltipContent: string;
}> = ({ label, value, tooltipId, tooltipContent }) => (
  <div className="p-3 rounded-lg bg-gray-600 text-gray-200">
    <div className="font-semibold text-sm mb-1 flex items-center">
      {label}
      <Info
        className="ml-2 text-gray-400 cursor-pointer"
        size={16}
        data-tooltip-id={tooltipId}
        data-tooltip-content={tooltipContent}
      />
    </div>
    <div className="text-lg font-bold">{value}</div>
  </div>
);

export default SequentialSimilarityVisualization;