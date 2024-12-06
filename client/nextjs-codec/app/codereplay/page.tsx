//page.tsx
'use client'
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import dbConnect from '../../lib/dbConnect';
import { NextResponse } from 'next/server';
import SimilarityLoading from './SimilarityLoading';

// Update the SimilarSnippet interface
interface SimilarSnippet {
  userId: string;
  similarity: number | null;
  jaccardScore: number | null;
  tfidfScore: number | null;
  codebertScore: number | null;
  timestamp: string;
  code: string;
  fileName: string;
}


import mongoose, { Model, Schema } from 'mongoose';

interface CodeSnippet {
  userId: string;
  code: string;
  timestamp: string;
  fileName: string;
}

const codeSnippetSchema = new Schema<CodeSnippet>({
  userId: String,
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

export default function CodeReplayApp() {
  const [code, setCode] = useState('// Start coding here');
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [similarSnippets, setSimilarSnippets] = useState<SimilarSnippet[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null);
  const [isFetchingSimilarity, setIsFetchingSimilarity] = useState(false);
  const [saveMode, setSaveMode] = useState<'manual' | 'auto'>('manual');
  const [lastSaved, setLastSaved] = useState<string>(code);

  // Function to check if code has significant changes
  const hasSignificantChanges = (newCode: string, oldCode: string) => {
    const lengthDiff = Math.abs(newCode.length - oldCode.length);
    return lengthDiff > 50; // Consider changes significant if more than 50 characters are added/removed
  };

  // Auto-save function
  const autoSaveCode = async (codeToSave: string) => {
    if (codeToSave === lastSaved) return; // Don't save if code hasn't changed
    
    setSaving(true);
    try {
      const userId = getUserId();
      const saveResponse = await fetch('/api/codereplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToSave,
          userId,
          problemId: 'sorting-1',
          roomId: 'room-1'
        }),
      });

      if (saveResponse.ok) {
        const savedData = await saveResponse.json();
        if (savedData.snippet && 'code' in savedData.snippet) {
          setSnippets(prevSnippets => [{
            userId: savedData.snippet.userId,
            code: savedData.snippet.code,
            timestamp: savedData.snippet.timestamp,
            fileName: savedData.snippet.fileName
          }, ...prevSnippets]);
          setLastSaved(codeToSave);
        }
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setSaving(false);
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
      let userId = localStorage.getItem('userId');
      if (!userId) {
        userId = `user-${Math.floor(Math.random() * 10000)}`;
        localStorage.setItem('userId', userId);
      }
      return userId;
    }
    return null;
  };

  const fetchSimilarityData = async (codeToCheck: string) => {
    try {
      setIsFetchingSimilarity(true);
      if (!codeToCheck.trim()) {
        setSimilarSnippets([]);
        setIsFetchingSimilarity(false);
        return;
      }

      const userId = getUserId();
      const response = await fetch('/api/codereplay/plagiarism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToCheck,
          userId,
          problemId: 'sorting-1',
          roomId: 'room-1'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.similarSnippets)) {
          setSimilarSnippets(data.similarSnippets);
        } else {
          setSimilarSnippets([]);
        }
      } else {
        console.error('Similarity fetch error:', response.status);
      }
    } catch (error) {
      console.error('Similarity fetch error:', error);
    } finally {
      setIsFetchingSimilarity(false);
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
        fetchSimilarityData(code);
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
              await fetchSimilarityData(code);
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

  const saveCode = async () => {
    setSaving(true);
    try {
      const userId = getUserId();
      const saveResponse = await fetch('/api/codereplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          userId,
          problemId: 'sorting-1',
          roomId: 'room-1'
        }),
      });

      if (saveResponse.ok) {
        const savedData = await saveResponse.json();
        if (savedData.snippet && 'code' in savedData.snippet) {
          setSnippets(prevSnippets => [{
            userId: savedData.snippet.userId,
            code: savedData.snippet.code,
            timestamp: savedData.snippet.timestamp,
            fileName: savedData.snippet.fileName
          }, ...prevSnippets]);
          await fetchSimilarityData(code);
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
    getUserId(); // This will create and store a userId if one doesn't exist
  }, []);

  const getSimilarityColor = (similarity: number | null | undefined) => {
    if (!similarity) return 'bg-gray-600';
    if (similarity > 80) return 'bg-red-600';
    if (similarity > 60) return 'bg-yellow-600';
    if (similarity > 30) return 'bg-green-600';
    return 'bg-gray-600';
  };
  
// Update the renderSimilarityScore function
const renderSimilarityScore = (label: string, score: number | null | undefined) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-sm text-gray-300">{label}:</span>
    <span className={`px-2 py-0.5 rounded text-sm ${getSimilarityColor(score)}`}>
      {score?.toFixed(1) ?? 'N/A'}%
    </span>
  </div>
);

  const checkSimilarity = async () => {
    await fetchSimilarityData(code);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-4">Code Replay System</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  onClick={() => saveCode()}
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
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Similarity Analysis</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {/* This is where you'll replace the existing code with the new loading logic */}
              {isFetchingSimilarity ? (
                <SimilarityLoading />
              ) : similarSnippets.length === 0 ? (
                <div className="text-gray-400">
                  No comparisons available yet
                </div>
              ) : (
                similarSnippets.map((snippet, index) => (
                  <div 
                    key={index}
                    className="border border-gray-700 rounded-lg p-4 hover:bg-gray-800 cursor-pointer"
                    onClick={() => setSelectedSnippet(snippet.code === selectedSnippet ? null : snippet.code)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="space-y-1">
                        <div>User: {snippet.userId}</div>
                        <div className="text-sm text-gray-400">
                          {new Date(snippet.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded ${getSimilarityColor(snippet.similarity)}`}>
                        {snippet.similarity?.toFixed(1) ?? 'N/A'}% Similar
                      </span>
                    </div>
                    {selectedSnippet === snippet.code && (
                      <div className="mt-2">
                        <div className="bg-gray-800 rounded p-3 mb-2">
                          <h3 className="text-sm font-semibold mb-2">Similarity Breakdown:</h3>
                          {renderSimilarityScore("Lexical Similarity (Jaccard)", snippet.jaccardScore)}
                          {renderSimilarityScore("Statistical Patterns (TF-IDF)", snippet.tfidfScore)}
                          {renderSimilarityScore("Semantic Meaning (CodeBERT)", snippet.codebertScore)}
                        </div>
                        <Editor
                          height="200px"
                          defaultLanguage="javascript"
                          value={snippet.code}
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
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Previous Submissions</h2>
          <div className="flex flex-wrap gap-4">
          {snippets.map((snippet, index) => (
            <div key={index} className="border border-gray-700 rounded-lg p-4 w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1rem)]">
              <div className="space-y-1 mb-2">
                <div>User: {snippet.userId}</div>
                <div className="text-sm text-gray-400">
                  {new Date(snippet.timestamp).toLocaleString()}
                </div>
              </div>
              <Editor
                height="300px" 
                defaultLanguage="javascript"
                value={snippet.code}
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
            {snippets.length === 0 && (
              <div className="text-gray-400">
                No submissions yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}