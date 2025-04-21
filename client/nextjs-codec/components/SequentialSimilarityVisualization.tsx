import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Pause, ChevronLeft, ChevronRight, Info, Clipboard } from 'lucide-react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import Editor from '@monaco-editor/react';
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface CodeSnapshot {
  code: string;
  timestamp: string;
  learner_id: string;
  problemId?: string;
  roomId?: string;
  submissionId?: string;
  version?: number;
}
interface SequentialSimilarity {
  from_index: number;
  to_index: number;
  learner_id: string;
  similarity: number;
  codebertScore: number;
}
interface EnhancedPasteInfo {
  learner_id: string;
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

interface SequentialSimilarityVisualizationProps {
  snapshots: CodeSnapshot[];
  pastedSnippets: EnhancedPasteInfo[];
  learnerId?: string;
}

const SequentialSimilarityVisualization: React.FC<SequentialSimilarityVisualizationProps> = ({
  snapshots,
  pastedSnippets,
  learnerId,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(0);
  const [localPastedSnippets, setLocalPastedSnippets] = useState<EnhancedPasteInfo[]>([]);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [sequentialSimilarities, setSequentialSimilarities] = useState<SequentialSimilarity[]>([]);
  const [pasteCount, setPasteCount] = useState(0);
  const [bigPasteCount, setBigPasteCount] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const notEnoughSnapshots = snapshots.length <= 2;

  useEffect(() => {
    if (notEnoughSnapshots) {
      return;
    }

    const calculateSequentialSimilarities = async (snapshotsToCompare: CodeSnapshot[]) => {
      setLoading(true);
      try {
        const learner_id = learnerId ? learnerId : snapshotsToCompare[0].learner_id;
        const problemId = snapshotsToCompare[0].problemId;
        const roomId = snapshotsToCompare[0].roomId;

        const API_URL = process.env.FLASK_API_URL || 'https://codecflaskapi.duckdns.org';
        // const API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/similarity/sequential?learner_id=${learner_id}&problemId=${problemId}&roomId=${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snapshots
          })
        });

        const data = await response.json();
        // console.log("Sequential Similarities Response:", data);
        if (response.ok) {
          // console.log("Response OK");
          setSequentialSimilarities(data.sequentialSimilarities);
        }
        // console.log("Sequential Similarities:", sequentialSimilarities);
      } catch (error) {
        console.error('Sequential similarity calculation error:', error);
      }
    };
    setLoading(false);
    calculateSequentialSimilarities(snapshots);
  }, [snapshots, notEnoughSnapshots]);

  // useEffect(() => {
  //   console.log("Sequential similarities updated:", sequentialSimilarities);
  // }, [sequentialSimilarities]);

  // useEffect(() => {
  //   console.log("Received Snapshots:", snapshots);
  // }, [snapshots]);

  const toggleCard = (index: number) => {
    setExpandedCards(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Add handlers for next and previous
  const handleNext = () => {
    if (currentSnapshotIndex < snapshots.length - 1) {
      setCurrentSnapshotIndex(prev => prev + 1);
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (currentSnapshotIndex > 0) {
      setCurrentSnapshotIndex(prev => prev - 1);
      setIsPlaying(false);
    }
  };

  // Add useEffect to log and set local state for snippets
  useEffect(() => {
    console.log('Received Paste Snippets:', pastedSnippets);
    if (pastedSnippets && pastedSnippets.length > 0) {
      setLocalPastedSnippets(pastedSnippets);
      setPasteCount(pastedSnippets.length);
      let count = 0; // Initialize count here
      for (let i = 0; i < pastedSnippets.length; i++) {
        if (pastedSnippets[i].text.length > 200) { // Access .text for UIRework compatibility
          count++;
        }
      }
      setBigPasteCount(prevCount => prevCount + count);
    }
  }, [pastedSnippets]);

  // Compute advanced metrics
  const advancedMetrics = useMemo(() => {
    if (sequentialSimilarities.length === 0 || notEnoughSnapshots) {
      return null;
    }

    const cssValues = sequentialSimilarities.map(s => s.similarity);

    // Max Change
    const changes = cssValues.slice(1).map((val, i) => Math.abs(val - cssValues[i]));
    const maxChange = Math.max(...changes);
    const maxChangePct = (maxChange / Math.max(...cssValues)) * 100; // Keep maxChangePct

    // Average Similarity
    const averageSimilarity = cssValues.reduce((a, b) => a + b, 0) / cssValues.length;

    // Minimum Similarity
    const minSimilarity = Math.min(...cssValues);

    // Variance Calculation
    const mean = averageSimilarity;
    const variance = cssValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / cssValues.length; // Corrected variance calculation
    const normalizedVariance = (variance / 2500) * 100;
    const weightedScore =
      (maxChange) * 0.05 +
      (100 - averageSimilarity) * 0.3+
      (100 - minSimilarity) * 0.6 +
      (normalizedVariance) * 0.05;

    return {
      maxChange: Math.round(maxChange),
      maxChangePct: Math.round(maxChangePct), // Keep maxChangePct
      averageSimilarity: Math.round(averageSimilarity),
      minSimilarity: Math.round(minSimilarity),
      variance: Math.round(variance), // Keep variance
      normalizedVariance: Math.round(normalizedVariance),
      weightedPlagiarismScore: Math.round(weightedScore),
      pasteCount, // Keep pasteCount
      bigPasteCount // Keep bigPasteCount
    };
  }, [sequentialSimilarities, pasteCount, bigPasteCount, notEnoughSnapshots]);


  useEffect(() => {
    // Prepare data for the chart
    setChartData(sequentialSimilarities.map((similarity, index) => ({
      name: `Snapshot ${Number.isFinite(similarity.from_index) ? similarity.from_index + 1 : '?'} to ${Number.isFinite(similarity.to_index) ? similarity.to_index + 1 : '?'}`,
      similarity: similarity.similarity,
      codebertScore: similarity.codebertScore
    })));
    console.log("Chart Data:", chartData);
    console.log("chartData length:", chartData.length);
    console.log("Sequential Similarities:", sequentialSimilarities);
  }, [sequentialSimilarities]);


  // Replay system logic
  useEffect(() => {
    let interval: string | number | NodeJS.Timeout | undefined;
    if (isPlaying && currentSnapshotIndex < snapshots.length - 1) {
      interval = setInterval(() => {
        setCurrentSnapshotIndex(prev => {
          if (prev >= snapshots.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500); // Change snapshot every 2 seconds
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSnapshotIndex, snapshots.length]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (value: React.SetStateAction<number>[]) => {
    setCurrentSnapshotIndex(value[0]);
    setIsPlaying(false);
  };


  const CustomSlider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { tooltipContent?: string }
  >(({ className, tooltipContent, ...props }, ref) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <SliderPrimitive.Root
            ref={ref}
            className="relative flex w-full touch-none select-none items-center py-4"
            {...props}
          >
            {/* Background track */}
            <SliderPrimitive.Track className="relative h-2 w-full grow rounded-full bg-gray-600">
              {/* Blue progress bar */}
              <SliderPrimitive.Range className="absolute h-full rounded-full bg-blue-500" />
            </SliderPrimitive.Track>
            {/* Thumb/Handle */}
            <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-blue-500 bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
          </SliderPrimitive.Root>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent || `Snapshot ${props.value?.[0] ? props.value?.[0] + 1 : null}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ));

  CustomSlider.displayName = "CustomSlider";

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

  interface MetricCardProps {
    label: string;
    value: string | number;
    tooltipId: string;
    tooltipContent: string;
  }

  const MetricCard: React.FC<MetricCardProps> = ({ label, value, tooltipId, tooltipContent }) => (
    <div className="p-3 rounded-lg bg-gray-600 text-gray-200 flex flex-col justify-center items-center">
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

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-6">
      {notEnoughSnapshots && (
        <div className="bg-blue-900/30 border border-blue-700 text-blue-300 rounded-lg p-4 text-center">
          <h4 className="text-md font-semibold">Not Enough Snapshots Detected</h4>
          <p>Similarity analysis requires multiple code snapshots. Only basic information is available.</p>
        </div>
      )}

      {!loading ? (
        <div className='w-full h-full flex items-center justify-center'>Loading...</div>
      ) : (
        advancedMetrics && !notEnoughSnapshots && (
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-md font-semibold mb-4">Advanced Similarity Metrics</h4>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {(() => {
                const plagiarismRisk = getPlagiarismRiskDetails(advancedMetrics.weightedPlagiarismScore);
                return (
                  <div className={`
                  col-span-2 p-4 rounded-lg text-center 
                  ${advancedMetrics.weightedPlagiarismScore > 80 ? 'bg-red-600' :
                      advancedMetrics.weightedPlagiarismScore > 60 ? 'bg-orange-600' :
                        advancedMetrics.weightedPlagiarismScore > 40 ? 'bg-yellow-600' :
                          'bg-green-600'} text-white`}
                  >
                    <div className="text-xs uppercase tracking-wide mb-1">Plagiarism Risk</div>
                    <div className="text-4xl font-bold mb-2">{advancedMetrics.weightedPlagiarismScore}%</div>
                    <div className="text-lg font-semibold">
                      {plagiarismRisk.level}
                    </div>
                  </div>
                );
              })()}

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="w-full h-full">
                    View Pasted Snippets ({pastedSnippets.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Pasted Code Snippets</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {pastedSnippets.map((snippet, index) => (
                      <div key={index} className="bg-gray-800 rounded-lg">
                        <button
                          onClick={() => toggleCard(index)}
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-700"
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
                        </button>

                        {expandedCards.includes(index) && (
                          <div className="p-4 border-t border-gray-700">
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
                        )}
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-5 gap-4">
              <MetricCard
                label="Max Change"
                value={`${advancedMetrics.maxChange}%`}
                tooltipId="maxChangeTooltip"
                tooltipContent="Maximum difference in similarity between consecutive snapshots, higher values indicate higher plagiarism risk"
              />
              <MetricCard
                label="Average Similarity"
                value={`${advancedMetrics.averageSimilarity}%`}
                tooltipId="averageSimilarityTooltip"
                tooltipContent="Mean value of all similarity scores, lower values indicate higher plagiarism risk"
              />
              <MetricCard
                label="Minimum Similarity"
                value={`${advancedMetrics.minSimilarity}%`}
                tooltipId="minSimilarityTooltip"
                tooltipContent="Lowest similarity score observed, lower values indicate higher plagiarism risk"
              />
              <MetricCard
                label="Variance"
                value={`${advancedMetrics.normalizedVariance}%`}
                tooltipId="varianceTooltip"
                tooltipContent="Measure of similarity score fluctuation, higher values indicate higher plagiarism risk"
              />
              <MetricCard
                label="Big Pastes"
                value={bigPasteCount}
                tooltipId="bigPastesTooltip"
                tooltipContent="Number of large paste (More than 200 Characters) operations detected"
              />
            </div>
          </div>
        )
      )}

      {!loading ? (
        <div className='w-full h-full flex items-center justify-center'>Loading...</div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {!notEnoughSnapshots ? (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-semibold mb-4">Similarity Trends</h4>

              <ResponsiveContainer width="100%" height={400}>
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
            </div>) : (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-semibold mb-4">Similarity Trends</h4>
              <div className="flex items-center justify-center h-[400px] text-gray-400">
                <p>Not enough snapshots to calculate similarity trends.</p>
              </div>
            </div>
          )}

          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-md font-semibold mb-4">Code Evolution Replay</h4>

            <div className="h-64 mb-4">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                value={snapshots[currentSnapshotIndex]?.code || ''}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on'
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 px-2">
                <div className="flex items-center space-x-2">
                  {/* Disable controls if only one snapshot */}
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    size="icon"
                    disabled={currentSnapshotIndex === 0 || notEnoughSnapshots}
                    className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={handlePlayPause}
                    variant="secondary"
                    size="sm"
                    disabled={notEnoughSnapshots}
                    className="flex items-center space-x-2 px-3"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
                  </Button>

                  <Button
                    onClick={handleNext}
                    variant="outline"
                    size="icon"
                    disabled={currentSnapshotIndex === snapshots.length - 1 || notEnoughSnapshots}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1">
                  <CustomSlider
                    value={[currentSnapshotIndex]}
                    max={snapshots.length - 1}
                    step={1}
                    onValueChange={handleSliderChange}
                    disabled={notEnoughSnapshots}
                  />
                </div>
              </div>

              <div className="text-center text-sm text-gray-400">
                {notEnoughSnapshots ? (
                  "Not enough snapshots available"
                ) : (
                  <>
                    Snapshot {currentSnapshotIndex + 1} of {snapshots.length}
                  </>
                )}
                <br />
                {snapshots[currentSnapshotIndex]?.timestamp &&
                  new Date(snapshots[currentSnapshotIndex].timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}


      <ReactTooltip id="maxChangeTooltip" place="top" />
      <ReactTooltip id="averageSimilarityTooltip" place="top" />
      <ReactTooltip id="minSimilarityTooltip" place="top" />
      <ReactTooltip id="varianceTooltip" place="top" />
      <ReactTooltip id="pastesTooltip" place="top" />
      <ReactTooltip id="bigPastesTooltip" place="top" />
    </div>
  );
};

export default SequentialSimilarityVisualization;