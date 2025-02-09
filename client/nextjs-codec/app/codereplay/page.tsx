//page.tsx
'use client'
import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, FileCode2, Network, GitBranch, Activity } from "lucide-react";
import Editor from '@monaco-editor/react';
import dbConnect from '../../lib/dbConnect';
import { NextResponse } from 'next/server';
import SimilarityLoading from './SimilarityLoading';
import mongoose, { Model, Schema } from 'mongoose';
import SimilarityNetwork from './SimilarityMatrix';
import SequentialSimilarityVisualization from './SequentialSimilarityVisualization';

interface CodeSnapshot {
  code: string;
  timestamp: string;
  learner_id: string;
  problemId?: string;
  roomId?: string;
  submissionId?: string;
  version?: number;
}

interface SnapshotSimilarity {
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

interface SimilarSnippet {
  learner_id: string;
  similarity: number;
  codebertScore: number;
  timestamp: string;
  code: string;
  fileName: string;
  clusterId?: number;
  isLikelySource?: boolean;
}

interface CodeSnippet {
  learner_id: string;
  code: string;
  timestamp: string;
  fileName: string;
}

const codeSnippetSchema = new Schema<CodeSnippet>({
  learner_id: String,
  code: String,
  timestamp: String,
  fileName: String,
});

const CodeSnippetModel = mongoose.model<CodeSnippet>('CodeSnippet', codeSnippetSchema);

export async function GET() {
  try {
    await dbConnect();
    const allSnippets = await CodeSnippetModel.find({}).lean();
    return NextResponse.json({ success: true, snippets: allSnippets });
  } catch (error) {
    console.error('Error fetching snippets:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch snippets' }, { status: 500 });
  }
}

const getSimilarityColor = (similarity) => {
  if (similarity >= 80) return 'bg-red-700 text-white';
  if (similarity >= 60) return 'bg-yellow-600 text-white';
  return 'bg-gray-700 text-white';
};

interface SimilarityMatrix {
  matrix: number[][];
  snippets: SnippetInfo[];
}

interface AdvancedMetrics {
  weightedPlagiarismScore: number;
}

export default function CodeReplayApp() {
  const [code, setCode] = useState('// Start coding here');
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [similarSnippets, setSimilarSnippets] = useState<SimilarSnippet[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null);
  const [isFetchingSimilarity, setIsFetchingSimilarity] = useState(false);
  const [saveMode, setSaveMode] = useState<'manual' | 'auto'>('manual');
  const [lastSaved, setLastSaved] = useState<string>(code);
  const [selectedAnalysisSnippet, setSelectedAnalysisSnippet] = useState(null);
  const [similarityMatrix, setSimilarityMatrix] = useState<{
    matrix: number[][];
    snippets: SnippetInfo[];
  } | null>(null);
  const [expandedSnippet, setExpandedSnippet] = useState(null);
  const [isMatrixLoading, setIsMatrixLoading] = useState(true);
  const [referenceFile, setReferenceFile] = useState<string>(''); // State to hold the reference file

  const [snapshots, setSnapshots] = useState<CodeSnapshot[]>([]);
  const [sequentialSimilarities, setSequentialSimilarities] = useState<SnapshotSimilarity[]>([]);
  const [pasteCount, setPasteCount] = useState(0);
  const [bigPasteCount, setBigPasteCount] = useState(0);
  const [enhancedPastes, setEnhancedPastes] = useState<EnhancedPasteInfo[]>([]);
  const editorRef = useRef<Monaco.IStandaloneCodeEditor | null>(null);

  const handleEditorMount = (editor: Monaco.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    editorRef.current = editor;

    editor.onDidPaste((event) => {
      try {
        const model = editor.getModel();
        if (!model) return;

        const pastedText = model.getValueInRange(event.range);
        const fullCode = model.getValue();

        const newPaste: EnhancedPasteInfo = {
          text: pastedText,
          fullCode: fullCode,
          timestamp: new Date().toISOString(),
          length: pastedText.length,
          contextRange: {
            startLine: event.range.startLineNumber,
            startColumn: event.range.startColumn,
            endLine: event.range.endLineNumber,
            endColumn: event.range.endColumn
          }
        };

        setEnhancedPastes(prev => [...prev, newPaste]);
        setPasteCount(prev => prev + 1);
        if (pastedText.length > 200) {
          setBigPasteCount(prev => prev + 1);
        }

        if (saveMode === 'auto') {
          autoSaveCode(fullCode);
        }
      } catch (error) {
        console.error('Error handling paste event:', error);
      }
    });
  };

  // Function to check if code has significant changes
  const hasSignificantChanges = (newCode: string, oldCode: string) => {
    const lengthDiff = Math.abs(newCode.length - oldCode.length);
    return lengthDiff > 50;
  };

  // Auto-save function with version control
  const autoSaveCode = async (codeToSave: string) => {
    if (codeToSave === lastSaved) return;

    setSaving(true);
    try {
      const learner_id = await getUserId();
      const lastVersion = snapshots.length > 0
        ? Math.max(...snapshots.map(snapshot => snapshot.version || 0))
        : 0;
      const nextVersion = lastVersion + 1;

      const saveResponse = await fetch('/api/codereplayV3/code-snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToSave,
          learner_id,
          problemId: 'sorting-1',
          roomId: 'room-1',
          submissionId: `submission-${Date.now()}`,
          version: nextVersion
        }),
      });

      if (saveResponse.ok) {
        const savedData = await saveResponse.json();
        if (savedData.snippet) {
          setSnapshots(prevSnapshots => {
            const updatedSnapshots = [...prevSnapshots, savedData.snippet];
            return updatedSnapshots.sort((a, b) => {
              if (a.version && b.version) {
                return a.version - b.version;
              }
              return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            });
          });
          setLastSaved(codeToSave);
          await calculateSequentialSimilarities([...snapshots, savedData.snippet]);
        }
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const calculateSequentialSimilarities = async (snapshotsToCompare: CodeSnapshot[]) => {
    try {
      setIsFetchingSimilarity(true);
      const response = await fetch('/api/codereplayV3/code-snapshots/sequential-similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshots: snapshotsToCompare,
          problemId: 'sorting-1',
          roomId: 'room-1'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.sequentialSimilarities)) {
          setSequentialSimilarities(data.sequentialSimilarities);
        }
      }
    } catch (error) {
      console.error('Sequential similarity calculation error:', error);
    } finally {
      setIsFetchingSimilarity(false);
    }
  };

  // // Function to check if code has significant changes
  // const hasSignificantChanges = (newCode: string, oldCode: string) => {
  //   const lengthDiff = Math.abs(newCode.length - oldCode.length);
  //   return lengthDiff > 50; // Consider changes significant if more than 50 characters are added/removed
  // };

  // // Auto-save function
  // const autoSaveCode = async (codeToSave: string) => {
  //   if (codeToSave === lastSaved) return; // Don't save if code hasn't changed

  //   setSaving(true);
  //   try {
  //     const learner_id = getUserId();
  //     const saveResponse = await fetch('/api/codereplay', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         code: codeToSave,
  //         learner_id,
  //         problemId: 'sorting-1',
  //         roomId: 'room-1'
  //       }),
  //     });

  //     if (saveResponse.ok) {
  //       const savedData = await saveResponse.json();
  //       if (savedData.snippet && 'code' in savedData.snippet) {
  //         setSnippets(prevSnippets => [{
  //           learner_id: savedData.snippet.learner_id,
  //           code: savedData.snippet.code,
  //           timestamp: savedData.snippet.timestamp,
  //           fileName: savedData.snippet.fileName
  //         }, ...prevSnippets]);
  //         setLastSaved(codeToSave);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Auto-save error:', error);
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  // Auto-save effect
  useEffect(() => {
    if (saveMode !== 'auto') return;

    let autoSaveTimer: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (document.hidden && code !== lastSaved) {
        autoSaveCode(code);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (code !== lastSaved) {
        autoSaveCode(code);
      }
    };

    // Save on significant changes or every 10 seconds
    if (code !== '// Start coding here' &&
      (hasSignificantChanges(code, lastSaved) || code !== lastSaved)) {
      autoSaveTimer = setTimeout(() => {
        autoSaveCode(code);
      }, 10000);
    }

    // Add event listeners for tab/window changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(autoSaveTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [code, saveMode, lastSaved]);


  const getUserId = () => {
    if (typeof window !== 'undefined') {
      let learner_id = localStorage.getItem('learner_id');
      if (!learner_id) {
        learner_id = `user-${Math.floor(Math.random() * 10000)}`;
        localStorage.setItem('learner_id', learner_id);
      }
      return learner_id;
    }
    return null;
  };

  const fetchSimilarityData = async () => {
    try {
      setIsMatrixLoading(true);
      const response = await fetch('/api/codereplay/plagiarism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: 'sorting-1',
          roomId: 'room-1'
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSimilarityMatrix({
          matrix: data.matrix,
          snippets: data.snippets
        });
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsMatrixLoading(false);
    }
  };

  useEffect(() => {
    const fetchAllSnippets = async () => {
      try {
        const response = await fetch('/api/codereplay');
        const data = await response.json();
        if (data.success) {
          console.log('All snippets:', data.snippets);
        } else {
          console.error('Error fetching snippets:', data.error);
        }
      } catch (error) {
        console.error('Error fetching snippets:', error);
      }
    };
    fetchAllSnippets();
  }, []);

  useEffect(() => {
    async function seedDatabase() {
      const response = await fetch('/api/seed');
      const data = await response.json();
      console.log(data);
    }
    seedDatabase();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (code !== '// Start coding here') {
        fetchSimilarityData();
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timer);
  }, [code]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/codereplay');
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.snippets)) {
            setSnippets(data.snippets);
            if (code !== '// Start coding here') {
              await fetchSimilarityData();
            }
          } else {
            console.error('Error in response:', data.error || 'Invalid data format');
          }
        } else {
          console.error('Initial fetch error:', response.status);
        }
      } catch (error) {
        console.error('Initial fetch error:', error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/codereplay');
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.snippets)) {
            setSnippets(data.snippets);
            await fetchSimilarityData(); // Fetch matrix immediately
          }
        }
      } catch (error) {
        console.error('Initial fetch error:', error);
      }
    };

    fetchInitialData();
  }, []);

  // useEffect(() => {
  //   const fetchReferenceFile = async () => {
  //     try {
  //       const response = await fetch('/api/reference-file'); // Replace with your API endpoint
  //       const data = await response.json();
  //       if (data.success) {
  //         setReferenceFile(data.referenceFile); // Set the reference file
  //       }
  //     } catch (error) {
  //       console.error('Error fetching reference file:', error);
  //     }
  //   };

  //   fetchReferenceFile();
  // }, []);

  const saveCode = async () => {
    setSaving(true);
    try {
      const learner_id = getUserId();
      const saveResponse = await fetch('/api/codereplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          learner_id,
          problemId: 'sorting-1',
          roomId: 'room-1'
        }),
      });

      if (saveResponse.ok) {
        const savedData = await saveResponse.json();
        if (savedData.snippet && 'code' in savedData.snippet) {
          setSnippets(prevSnippets => [{
            learner_id: savedData.snippet.learner_id,
            code: savedData.snippet.code,
            timestamp: savedData.snippet.timestamp,
            fileName: savedData.snippet.fileName
          }, ...prevSnippets]);
          await fetchSimilarityData();
        }
      } else {
        console.error('Save error:', saveResponse.status);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    getUserId(); // This will create and store a learner_id if one doesn't exist
  }, []);

  // Calculate statistics for each snippet
  const calculateSnippetStats = (matrix, index) => {
    if (!matrix || !matrix[index]) return null;

    const similarities = matrix[index].filter((_, i) => i !== index);
    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    const maxSimilarity = Math.max(...similarities);

    // Find highly similar snippets (>= 60%)
    const similarSnippets = similarities
      .map((similarity, i) => ({ index: i, similarity }))
      .filter(item => item.similarity >= 60 && item.index !== index)
      .sort((a, b) => b.similarity - a.similarity);

    return {
      averageSimilarity: avgSimilarity,
      maxSimilarity,
      similarSnippets
    };
  };

  const getColorClass = (similarity) => {
    if (similarity >= 80) return 'bg-red-700';
    if (similarity >= 60) return 'bg-yellow-600';
    return 'bg-gray-500';
  };

  const [activeTab, setActiveTab] = useState<'network' | 'evolution'>('network');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [advancedMetrics, setAdvancedMetrics] = useState<{ [key: string]: number }>({});

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-yellow-500" />
          CodeCheck
        </h1>
        <Tabs defaultValue="network" className="w-full">
          <TabsList className="bg-gray-800 border-b border-gray-700">
            <TabsTrigger value="network" className="data-[state=active]:bg-gray-700">
              <Network className="w-4 h-4 mr-2 text-yellow-500" />
              Similarity Network
            </TabsTrigger>
            <TabsTrigger value="evolution" className="data-[state=active]:bg-gray-700">
              <GitBranch className="w-4 h-4 mr-2 text-yellow-500" />
              Code Evolution
            </TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="mt-6">
            {isMatrixLoading ? (
              <SimilarityLoading />
            ) : (
              <div className="space-y-6">
                {similarityMatrix ?
                  <SimilarityNetwork
                    matrix={similarityMatrix.matrix}
                    snippets={similarityMatrix.snippets}
                  /> : null
                }

                <div className="space-y-4">
                  {similarityMatrix?.snippets.map((snippet, index) => {
                    const stats = calculateSnippetStats(similarityMatrix.matrix, index);
                    if (!stats) return null;

                    return (
                      <Card key={index} className="bg-gray-800/50 border-0 shadow-lg hover:bg-gray-800/70 transition-colors">
                        {/* ... existing card content ... */}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="evolution" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative">
              {similarityMatrix?.snippets.map((snippet, index) => (
                <div key={index} className={`${expandedCard === index ? 'col-span-full row-span-2' : ''
                  } transition-all duration-300`}>
                  <Card className="bg-gray-800/50 border-0 shadow-lg h-full">
                    <CardHeader
                      className="cursor-pointer p-4"
                      onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                    >
                      <CardTitle className="text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <FileCode2 className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{snippet.learner_id}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className={`${(advancedMetrics[snippet.learner_id]?.weightedPlagiarismScore || 0) >= 80 ? 'bg-red-600' :
                                (advancedMetrics[snippet.learner_id]?.weightedPlagiarismScore || 0) >= 60 ? 'bg-yellow-600' :
                                  'bg-gray-600'
                              }`}>
                              {(advancedMetrics[snippet.learner_id]?.weightedPlagiarismScore || 0).toFixed(1)}%
                            </Badge>
                            {expandedCard === index ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    {expandedCard === index && (
                      <CardContent className="p-4">
                        <SequentialSimilarityVisualization
                          snapshots={snapshots.filter(s => s.learner_id === snippet.learner_id)}
                          sequentialSimilarities={sequentialSimilarities}
                          pasteCount={pasteCount}
                          bigPasteCount={bigPasteCount}
                          pastedSnippets={enhancedPastes}
                          onMetricsUpdate={(metrics) => {
                            setAdvancedMetrics(prev => ({
                              ...prev,
                              [snippet.learner_id]: metrics
                            }));
                          }}
                        />
                      </CardContent>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};