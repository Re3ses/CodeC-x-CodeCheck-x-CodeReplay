'use client'
import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { editor as Monaco } from 'monaco-editor';
import SimilarityLoading from './SimilarityLoading';
import SequentialSimilarityVisualization from './SequentialSimilarityVisualization';

interface CodeSnapshot {
  code: string;
  timestamp: string;
  userId: string;
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

interface PasteInfo {
  text: string;
  timestamp: string;
  length: number;
}

// Enhanced paste tracking interfaces
interface EnhancedPasteInfo {
  text: string;          // The pasted text
  fullCode: string;      // Complete code after paste
  timestamp: string;
  length: number;
  contextRange: {        // Range of the paste in the full code
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

export default function CodeSnapshotComparisonApp() {
  const [problemId, setProblemId] = useState('sorting-challenge');
  const [roomId, setRoomId] = useState('coding-room-01');
  const [code, setCode] = useState('// Start coding here');
  const [snapshots, setSnapshots] = useState<CodeSnapshot[]>([]);
  const [sequentialSimilarities, setSequentialSimilarities] = useState<SnapshotSimilarity[]>([]);
  const [saving, setSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(true);
  const [saveMode, setSaveMode] = useState<'manual' | 'auto'>('manual');
  const [lastSaved, setLastSaved] = useState<string>(code);
  const [isFetchingSimilarity, setIsFetchingSimilarity] = useState(false);
  const [pasteCount, setPasteCount] = useState(0);
  const [bigPasteCount, setBigPasteCount] = useState(0);
  const [enhancedPastes, setEnhancedPastes] = useState<EnhancedPasteInfo[]>([]);
  
  const editorRef = useRef<Monaco.IStandaloneCodeEditor | null>(null);

  // Updated handleEditorMount with enhanced paste tracking
  const handleEditorMount = (editor: Monaco.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    editorRef.current = editor;

    editor.onDidPaste((event) => {
      try {
        const model = editor.getModel();
        if (!model) return;

        // Get the pasted content and its range
        const pastedText = model.getValueInRange(event.range);
        const fullCode = model.getValue();

        // Create enhanced paste info
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

        // Update paste tracking state
        setEnhancedPastes(prev => [...prev, newPaste]);
        setPasteCount(prev => prev + 1);
        if (pastedText.length > 200) {
          setBigPasteCount(prev => prev + 1);
        }

        // Optional: Automatically save after a paste
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
    return lengthDiff > 50; // Consider changes significant if more than 50 characters are added/removed
  };

  // Get or generate a unique user ID
  const getUserId = async () => {
    if (typeof window !== 'undefined') {
      // First, check if we have a stored userId
      let userId = localStorage.getItem('userId');
      
      // If no stored userId, try to fetch from existing snapshots
      if (!userId) {
        try {
          const response = await fetch('/api/codereplayV3/code-snapshots');
          const data = await response.json();
          
          if (data.success && data.snapshots.length > 0) {
            // Use the userId from the first snapshot
            userId = data.snapshots[0].userId;
          }
          
          // If still no userId, generate a random one
          if (!userId) {
            userId = `user-${Math.floor(Math.random() * 10000)}`;
          }
          
          // Store the userId
          localStorage.setItem('userId', userId);
        } catch (error) {
          console.error('Error fetching snapshots:', error);
          // Fallback to random userId if fetch fails
          userId = `user-${Math.floor(Math.random() * 10000)}`;
          localStorage.setItem('userId', userId);
        }
      }
      
      return userId;
    }
    return null;
  };

  // Auto-save function
  const autoSaveCode = async (codeToSave: string) => {
    if (codeToSave === lastSaved) return;
    
    setSaving(true);
    try {
      const userId = await getUserId();
      
      // Find the last version from existing snapshots
      const lastVersion = snapshots.length > 0 
        ? Math.max(...snapshots.map(snapshot => snapshot.version || 0))
        : 0;

      // Increment the last version by 1
      const nextVersion = lastVersion + 1;

      const saveResponse = await fetch('/api/codereplayV3/code-snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToSave,
          userId,
          problemId: 'sorting-challenge',
          roomId: 'coding-room-01',
          submissionId: `submission-${Date.now()}`,
          version: nextVersion // Explicitly pass the next version
        }),
      });
    
      if (saveResponse.ok) {
        const savedData = await saveResponse.json();
        if (savedData.snippet) {
          // Update snapshots while maintaining order
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
          
          // Recalculate sequential similarities
          await calculateSequentialSimilarities([...snapshots, savedData.snippet]);
        }
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setSaving(false);
    }
  };

  // Seed database on component mount
  useEffect(() => {
    const seedDatabase = async () => {
      try {
        // First, try to seed
        const seedResponse = await fetch('/api/codereplayV3/seed', { method: 'GET' });
        const seedResult = await seedResponse.json();
        console.log('Seeding result:', seedResult);
        
        // Then fetch snapshots
        await fetchInitialSnapshots();
      } catch (error) {
        console.error('Seeding error:', error);
      } finally {
        setIsSeeding(false);
      }
    };

    seedDatabase();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Fetch initial snapshots
  const fetchInitialSnapshots = async () => {
    try {
      const response = await fetch('/api/codereplayV3/code-snapshots');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.snapshots)) {
        // Sort snapshots by version and timestamp
        const sortedSnapshots = data.snapshots.sort((a: CodeSnapshot, b: CodeSnapshot) => {
          // First sort by version if available, then by timestamp
          if (a.version && b.version) {
            return a.version - b.version;
          }
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });
        
        setSnapshots(sortedSnapshots);
        
        // Calculate sequential similarities if more than one snapshot
        if (sortedSnapshots.length > 1) {
          await calculateSequentialSimilarities(sortedSnapshots);
        }
      }
    } catch (error) {
      console.error('Error fetching snapshots:', error);
    }
  };

  // Calculate sequential similarities
  const calculateSequentialSimilarities = async (snapshotsToCompare: CodeSnapshot[]) => {
    try {
      setIsFetchingSimilarity(true);
      const response = await fetch('/api/codereplayV3/code-snapshots/sequential-similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshots: snapshotsToCompare,
          problemId: 'sorting-challenge',
          roomId: 'coding-room-01'
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

  // Auto-save effect
  useEffect(() => {
    if (saveMode !== 'auto') return;

    let autoSaveTimer: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (document.hidden && code !== lastSaved) {
        autoSaveCode(code);
      }
    };

    const handleBeforeUnload = () => {
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

  // Manual save function
  const saveCode = async () => {
    await autoSaveCode(code);
  };
  
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-4">CodeReplay</h1>
        <div className="space-y-4">
          {/* <h2 className="text-xl font-semibold">Sequential Similarity Analysis</h2> */}
          {isFetchingSimilarity ? (
            <SimilarityLoading />
          ) : (
            <div className="container mx-auto p-4">
              <SequentialSimilarityVisualization 
                snapshots={snapshots} 
                sequentialSimilarities={sequentialSimilarities} 
                pasteCount={pasteCount}
                bigPasteCount={bigPasteCount}
                pastedSnippets={enhancedPastes}
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <select
                value={saveMode}
                onChange={(e) => setSaveMode(e.target.value as 'manual' | 'auto')}
                className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700"
              >
                <option value="manual">Manual Save</option>
                <option value="auto">Auto Save</option>
              </select>
              {saveMode === 'manual' && (
                <button
                  onClick={saveCode}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Code'}
                </button>
              )}
              {saveMode === 'auto' && saving && (
                <span className="text-gray-400">Auto-saving...</span>
              )}
            </div>
            <div className="border border-gray-700 rounded-lg overflow-hidden">
              <Editor
                height="400px"
                defaultLanguage="javascript"
                value={code}
                onChange={(value) => setCode(value || '')}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Previous Snapshots</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {snapshots.map((snapshot, index) => (
                <div 
                  key={index} 
                  className="border border-gray-700 rounded-lg p-4"
                >
                  <div className="space-y-1 mb-2">
                    <div>User: {snapshot.userId}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(snapshot.timestamp).toLocaleString()}
                    </div>
                    {snapshot.version && (
                      <div className="text-sm text-gray-500">
                        Version: {snapshot.version}
                      </div>
                    )}
                  </div>
                  <Editor
                    height="300px" 
                    defaultLanguage="javascript"
                    value={snapshot.code}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 14,
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                    }}
                  />
                </div>
              ))}
              {snapshots.length === 0 && (
                <div className="text-gray-400">
                  No snapshots yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}