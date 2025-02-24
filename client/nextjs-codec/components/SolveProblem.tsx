'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Editor } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Zap, GripVertical, GripHorizontal, CheckCircle2, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SafeHtml from '@/components/SafeHtml';
import axios from 'axios';
import { GetProblems, SilentLogin } from '@/utilities/apiService';
import {
  getBatchSubmisisons,
  getLanguage,
  getLanguages,
  getSubmission,
  postBatchSubmissions,
  postSubmission,
} from '@/utilities/rapidApi';
import { ProblemSchemaInferredType } from '@/lib/interface/problem';
import { getUser } from '@/lib/auth';

// Code Replay Imports
import { editor as Monaco } from 'monaco-editor';

type LanguageData = {
  id: number;
  name: string;
};

type MonacoLanguageMap = {
  [key: string]: {
    language: string;
    defaultCode?: string;
  };
};

const SUPPORTED_LANGUAGES = {
  CPP: '54',    // C++ (GCC 9.2.0)
  JAVA: '62',   // Java (OpenJDK 13.0.1)
  PYTHON: '71', // Python (3.8.1)
  C: '50',      // C (GCC 9.2.0)
  CSHARP: '51', // C# (Mono 6.6.0.161)
  JAVASCRIPT: '63', // JavaScript (Node.js 12.14.1)
} as const;

interface CodeEditorProps {
  userType: 'mentor' | 'learner';
  roomId: string;
  problemId: string;
  autoSaveEnabled?: boolean; // New prop for toggling autosave
}

export default function CodeEditor({ userType, roomId, problemId, autoSaveEnabled = false }: CodeEditorProps) {
  const editorRef = useRef<Monaco.IStandaloneCodeEditor>();

  // State management
  const [problem, setProblem] = useState<ProblemSchemaInferredType>();
  const [editorValue, setEditorValue] = useState<string>(
    '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}'
  );
  const [selectedLang, setSelectedLang] = useState<string>(SUPPORTED_LANGUAGES.CPP);
  const [compileResult, setCompileResult] = useState<any>();
  const [languages, setLanguages] = useState<LanguageData[]>();
  const [inputVal, setInputVal] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [score, setScore] = useState<any>();
  const [batchResult, setBatchResult] = useState<any>();
  const [learner, setLearner] = useState<string>();
  const [isInitialized, setIsInitialized] = useState(false);

  // Autosave states
  const [lastSaved, setLastSaved] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [enhancedPastes, setEnhancedPastes] = useState<EnhancedPasteInfo[]>([]);

  type EnhancedPasteInfo = {
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
  };

  // Function to check if code has significant changes
  const hasSignificantChanges = (newCode: string, oldCode: string) => {
    const lengthDiff = Math.abs(newCode.length - oldCode.length);
    return lengthDiff > 50; // Consider changes significant if more than 50 characters are added/removed
  };

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled) return;

    // Autosave Functions
    const autoSaveCode = async (codeToSave: string) => {
      if (codeToSave === lastSaved) return;
      setSaving(true);
      try {
        console.log('Auto-saving...');

        // Find the last version from existing snapshots
        const lastVersion = snapshots.length > 0
          ? Math.max(...snapshots.map(snapshot => snapshot.version || 0))
          : 0;

        // Increment the last version by 1
        const nextVersion = lastVersion + 1;

        const saveResponse = await fetch('/api/codereplay/code-snapshots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: codeToSave,
            learner_id: learner,
            problemId: problemId,
            roomId: roomId,
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
            console.log("snapshots: ", snapshots);
          }
        }
      } catch (error) {
        console.error('Auto-save error:', error);
      } finally {
        setSaving(false);
      }
    };

    let autoSaveTimer: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (document.hidden && editorValue !== lastSaved) {
        autoSaveCode(editorValue);
      }
    };

    const handleBeforeUnload = () => {
      if (editorValue !== lastSaved) {
        autoSaveCode(editorValue);
      }
    };

    // Save on significant changes or every 10 seconds
    if (editorValue !== '// Start coding here' &&
      (hasSignificantChanges(editorValue, lastSaved) || editorValue !== lastSaved)) {
      autoSaveTimer = setTimeout(() => {
        autoSaveCode(editorValue);
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
  }, [editorValue, autoSaveEnabled, lastSaved,]);

  // Replace the handleEditorDidMount function
  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;

    editor.onDidPaste((event: any) => {
      try {
        console.log("PASTE EVENT:", event);
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
      } catch (error) {
        console.error('Error handling paste event:', error);
      }
    });
  }

  // UseEffect to log paste history
  useEffect(() => {
    console.log("Paste History: ", enhancedPastes);
  }, [enhancedPastes]);


  useEffect(() => {
    if (selectedLang && editorRef.current && !isInitialized) {
      const editor = editorRef.current;

      const languageMap: MonacoLanguageMap = {
        [SUPPORTED_LANGUAGES.CPP]: { language: 'cpp' },
        [SUPPORTED_LANGUAGES.JAVA]: { language: 'java' },
        [SUPPORTED_LANGUAGES.PYTHON]: { language: 'python' },
        [SUPPORTED_LANGUAGES.C]: { language: 'c' },
        [SUPPORTED_LANGUAGES.CSHARP]: { language: 'csharp' },
        [SUPPORTED_LANGUAGES.JAVASCRIPT]: { language: 'js' },
      };

      const selectedLanguage = languageMap[selectedLang];
      if (selectedLanguage) {
        // Set the language
        const model = editor.getModel();
        if (model) {
          Monaco.setModelLanguage(model, selectedLanguage.language);
        }
        setIsInitialized(true);
      } else {
        // Fallback to plaintext if language not found
        const model = editor.getModel();
        if (model) {
          Monaco.setModelLanguage(model, "plaintext");
        }
      }
    }
  }, [selectedLang, isInitialized]);

  // Initialize the editor with C++ as the default language
  useEffect(() => {
    setSelectedLang(SUPPORTED_LANGUAGES.CPP);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(problemId + '_started')) {
      localStorage.setItem(
        problemId + '_started',
        Date.now().toString()
      );
    }

    const initializeData = async () => {
      await SilentLogin();

      const [problemData, languagesData, userData] = await Promise.all([
        GetProblems(problemId),
        getLanguages(),
        getUser()
      ]);

      // Filter only supported languages
      const filteredLanguages = languagesData.filter((lang: LanguageData) =>
        Object.values(SUPPORTED_LANGUAGES).includes(lang.id.toString())
      );

      setProblem(problemData);
      setLanguages(filteredLanguages);
      setLearner(userData.id);
    };

    initializeData();
  }, [problemId]);

  async function getToken(input: string = '', expected: null | string = null) {
    const data = {
      source_code: btoa(editorValue),
      language_id: +selectedLang!,
      stdin: input != null ? btoa(input) : input,
      expected_output: typeof expected == 'string' ? btoa(expected) : expected,
    };
    return await postSubmission(data).then((res) => res.token);
  }

  async function handleSubmit(isTest: boolean = true) {
    if (!editorValue || !selectedLang) {
      toast({
        title: 'Language and source code should not be empty...',
        variant: 'destructive',
      });
      return;
    }

    const eval_problems = isTest
      ? problem?.test_cases.filter((item) => item.is_sample)
      : problem?.test_cases.filter((item) => item.is_eval);

    if (!eval_problems?.length) {
      toast({
        title: 'Cannot test, problem setter did not provide any sample cases. Use custom input instead',
        variant: 'destructive',
      });
      return;
    }

    const payload = eval_problems.map((val) => ({
      language_id: +selectedLang!,
      source_code: btoa(editorValue),
      stdin: btoa(val.input),
      expected_output: btoa(val.output),
    }));

    try {
      toast({ title: isTest ? 'Testing submission' : 'Processing submission' });
      const submissions = await postBatchSubmissions(payload);
      const tokens = submissions?.map((token: any) => token.token);

      const batchSubmissions = await getBatchSubmisisons(tokens.join());
      setBatchResult(batchSubmissions.submissions);

      const accepted = batchSubmissions.submissions.filter(
        (obj: any) => obj.status.description === 'Accepted'
      );

      const newScore = {
        accepted_count: accepted.length,
        overall_count: batchSubmissions.submissions.length,
      };
      setScore(newScore);

      // Update the submission section in handleSubmit
      if (!isTest) {
        try {
          const language_used = await getLanguage(+selectedLang);

          // Format dates consistently
          const startTime = parseInt(localStorage.getItem(problemId + '_started') || Date.now().toString());
          const endTime = Date.now();

          const submissionData = {
            language_used: language_used.name,
            code: editorValue,
            score: newScore.accepted_count,
            score_overall_count: newScore.overall_count,
            verdict: newScore.overall_count === newScore.accepted_count ? 'ACCEPTED' : 'REJECTED',
            learner: learner,
            problem: problemId,
            room: roomId,
            attempt_count: 1,
            start_time: startTime,
            end_time: endTime,
            completion_time: endTime - startTime,
            user_type: userType
          };

          console.log('Sending submission data:', submissionData);

          const url = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost'}:${process.env.NEXT_PUBLIC_SERVER_PORT || '3000'}/api/userSubmissions`;

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(submissionData)
          });

          // Log the raw response for debugging
          const responseText = await response.text();
          console.log('Raw response:', responseText);

          if (!response.ok) {
            // Try to parse error response
            let errorMessage = 'Server error';
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorData.error || 'Unknown error';
            } catch (e) {
              errorMessage = responseText || `HTTP ${response.status}`;
            }
            throw new Error(errorMessage);
          }

          // Parse the success response
          const result = JSON.parse(responseText);

          toast({
            title: 'Submission saved successfully',
            description: newScore.accepted_count === newScore.overall_count
              ? 'All test cases passed!'
              : `${newScore.accepted_count}/${newScore.overall_count} test cases passed`,
          });

        } catch (error) {
          console.error('Submission error details:', {
            error,
            submissions
          });

          toast({
            title: 'Failed to save submission',
            description: (error instanceof Error ? error.message : 'Please try again'),
            variant: 'destructive'
          });
        }
      } else {
        toast({ title: 'Test completed' });
      }

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'An error occurred while processing your submission',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  }

  async function handleTry() {
    if (!editorValue || !selectedLang) {
      toast({
        title: 'Language and source code should not be empty...',
        variant: 'destructive',
      });
      return;
    }

    if (showCustomInput) {
      // Handle custom input case
      if (!inputVal) {
        toast({
          title: 'No input detected...',
          variant: 'destructive'
        });
        return;
      }

      try {
        toast({ title: 'Compiling your code...' });

        const data = {
          source_code: btoa(editorValue),
          language_id: +selectedLang!,
          stdin: btoa(inputVal),
        };

        const result = await postSubmission(data);

        setTimeout(async () => {
          const submission = await getSubmission(result.token);
          setCompileResult(submission);

          if (submission.status.id === 3) {
            toast({ title: 'Successfully compiled!' });
          } else {
            toast({
              title: 'Compilation error',
              description: submission.status.description,
              variant: 'destructive'
            });
          }
        }, 3000);
      } catch (error) {
        toast({
          title: 'Error compiling code',
          description: 'Please try again',
          variant: 'destructive',
        });
      }
    } else {
      // Handle test cases
      const sample_cases = problem?.test_cases.filter((item) => item.is_sample);

      if (!sample_cases?.length) {
        toast({
          title: 'No sample test cases available',
          description: 'Use custom input instead',
          variant: 'destructive',
        });
        return;
      }

      toast({ title: 'Testing your code...' });

      try {
        const payload = sample_cases.map((test) => ({
          language_id: +selectedLang!,
          source_code: btoa(editorValue),
          stdin: btoa(test.input),
          expected_output: btoa(test.output),
        }));

        const submissions = await postBatchSubmissions(payload);
        const tokens = submissions?.map((token: any) => token.token);

        setTimeout(async () => {
          const batchSubmissions = await getBatchSubmisisons(tokens.join());
          setBatchResult(batchSubmissions.submissions);

          const accepted = batchSubmissions.submissions.filter(
            (obj: any) => obj.status.description === 'Accepted'
          );

          const newScore = {
            accepted_count: accepted.length,
            overall_count: batchSubmissions.submissions.length,
          };
          setScore(newScore);

          toast({
            title: newScore.accepted_count === newScore.overall_count
              ? 'All test cases passed!'
              : `${newScore.accepted_count}/${newScore.overall_count} test cases passed`,
            variant: newScore.accepted_count === newScore.overall_count ? 'default' : 'destructive'
          });
        }, 3000);
      } catch (error) {
        toast({
          title: 'Error testing code',
          description: 'Please try again',
          variant: 'destructive',
        });
      }
    }
  }

  const VerticalResizeHandle = () => (
    <PanelResizeHandle className="h-2 group hover:h-2 bg-gray-700 hover:bg-[#FFD700] transition-colors cursor-row-resize data-[resize-handle-active]:bg-[#FFD700] flex items-center justify-center">
      <div className="absolute flex items-center justify-center h-6 w-12 bg-gray-700 group-hover:bg-[#FFD700] rounded-md transition-colors">
        <GripHorizontal className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
      </div>
    </PanelResizeHandle>
  );

  const HorizontalResizeHandle = () => (
    <PanelResizeHandle className="w-2 group hover:w-2 bg-gray-700 hover:bg-[#FFD700] transition-colors cursor-col-resize data-[resize-handle-active]:bg-[#FFD700] flex items-center justify-center">
      <div className="absolute flex items-center justify-center w-6 h-12 bg-gray-700 group-hover:bg-[#FFD700] rounded-md transition-colors">
        <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
      </div>
    </PanelResizeHandle>
  );

  return (
    <div className="h-screen bg-gray-900 text-white">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Problem Description Panel */}
        <Panel
          defaultSize={40}
          minSize={20}
          maxSize={80}
          className="overflow-hidden" // Added to ensure proper sizing
        >
          <div className="flex flex-col h-full overflow-auto">
            {/* Problem Header */}
            <div className="bg-gray-800 p-4 rounded-lg m-3">
              <h1 className="text-xl font-bold mb-4 text-[#FFD700]">
                <SafeHtml html={problem?.name} />
              </h1>
              <div className="space-y-4 prose prose-invert">
                <SafeHtml html={problem?.description} />
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="font-semibold mb-2 text-[#FFD700]">Constraints</h4>
                  <SafeHtml html={problem?.constraints} />
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="font-semibold mb-2 text-[#FFD700]">Input Format</h4>
                  <SafeHtml html={problem?.input_format} />
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="font-semibold mb-2 text-[#FFD700]">Output Format</h4>
                  <SafeHtml html={problem?.output_format} />
                </div>
              </div>
            </div>

            {/* Sample Cases */}
            <div className="bg-gray-800 p-4 rounded-lg mx-3 mb-3">
              <h2 className="text-lg font-semibold mb-3 text-[#FFD700]">Sample Cases</h2>
              <div className="space-y-4">
                {problem?.test_cases
                  .filter(test => test.is_sample)
                  .map((test, index) => (
                    <div key={index} className="space-y-3">
                      {/* Sample Input */}
                      <div className="bg-gray-900 p-3 rounded">
                        <h3 className="text-sm font-semibold mb-2 text-[#FFD700]">
                          Sample Input {index + 1}
                        </h3>
                        <pre className="font-mono text-sm whitespace-pre-wrap">
                          {test.input}
                        </pre>
                      </div>
                      {/* Sample Output */}
                      <div className="bg-gray-900 p-3 rounded">
                        <h3 className="text-sm font-semibold mb-2 text-[#FFD700]">
                          Sample Output {index + 1}
                        </h3>
                        <pre className="font-mono text-sm whitespace-pre-wrap">
                          {test.output}
                        </pre>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Custom Input Section */}
            <div className="bg-gray-800 p-4 rounded-lg mx-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-[#FFD700]">Custom Input</h3>
                <Switch
                  checked={showCustomInput}
                  onCheckedChange={setShowCustomInput}
                  className="ml-2 data-[state=checked]:bg-[#FFD700]"
                />
              </div>
              {showCustomInput && (
                <textarea
                  className="w-full h-32 bg-gray-900 p-3 rounded-md font-mono text-sm resize-none border border-gray-700 focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
                  placeholder="Enter your test input here..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                />
              )}
            </div>
          </div>
        </Panel>


        <HorizontalResizeHandle />

        {/* Code Editor Panel */}
        <Panel
          defaultSize={60}
          minSize={20}
          maxSize={80}
          className="overflow-hidden"
        >
          <div className="flex flex-col h-full">
            {/* Toolbar - Add saving indicator */}
            <div className="bg-gray-800 p-3 flex justify-between items-center">
              <div className="flex items-center">
                <select
                  className="bg-gray-900 text-white px-4 py-2 rounded-md border border-gray-700 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]"
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                >
                  {languages?.filter(lang =>
                    Object.values(SUPPORTED_LANGUAGES).includes(lang.id.toString())
                  ).map((lang) => (
                    <option
                      key={lang.id}
                      value={lang.id}
                      selected={lang.id.toString() === SUPPORTED_LANGUAGES.CPP}
                    >
                      {lang.name}
                    </option>
                  ))}
                </select>
                {saving && (
                  <span className="ml-3 text-xs text-gray-400">
                    Saving...
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleTry}
                  className="flex items-center gap-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black"
                >
                  <Zap className="w-4 h-4" />
                  Try
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    handleSubmit(false);
                    setShowCustomInput(false);
                  }}
                  className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
                >
                  Submit
                </Button>
              </div>
            </div>
            <PanelGroup direction="vertical" className="flex-1">
              {/* Editor */}
              <Panel defaultSize={70} minSize={30}>
                <div className="h-full bg-gray-900">
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    defaultLanguage="cpp" // Set default language to C++
                    value={editorValue}
                    onChange={(value) => setEditorValue(value || '')}
                    onMount={handleEditorDidMount}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      lineNumbers: 'on',
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on',
                      formatOnPaste: true,
                      formatOnType: true
                    }}
                  />
                </div>
              </Panel>

              {/* <VerticalResizeHandle /> */}

              {/* Results Panel */}
              <Panel defaultSize={30} minSize={20}>
                <div className="h-full bg-gray-800 overflow-y-auto">
                  {showCustomInput ? (
                    <div className="p-4">
                      {compileResult?.status?.id !== 3 ? (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-red-500">Compilation Error</h3>
                          <pre className="bg-gray-900 p-3 rounded-md text-red-400 font-mono text-sm">
                            {atob(compileResult?.stderr || '')}
                          </pre>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-[#FFD700]">Output</h3>
                          <pre className="bg-gray-900 p-3 rounded-md font-mono text-sm">
                            {atob(compileResult?.stdout || '')}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="font-semibold text-[#FFD700]">Test Results</h3>
                        {score && (
                          <span className="px-2 py-1 rounded-full text-sm bg-gray-900">
                            {score.accepted_count}/{score.overall_count} Passed
                          </span>
                        )}
                      </div>

                      {batchResult ? (
                        <Tabs defaultValue="case1" className="w-full">
                          <TabsList className="justify-start bg-transparent border-b border-gray-700">
                            {batchResult.map((_: any, index: any) => (
                              <TabsTrigger
                                key={index}
                                value={`case${index + 1}`}
                                className={`flex items-center gap-2 ${batchResult[index].status.description === 'Accepted'
                                  ? 'text-green-500 data-[state=active]:text-green-500'
                                  : 'text-red-500 data-[state=active]:text-red-500'
                                  }`}
                              >
                                {batchResult[index].status.description === 'Accepted' ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                Test {index + 1}
                              </TabsTrigger>
                            ))}
                          </TabsList>

                          {batchResult.map((result: any, index: any) => (
                            <TabsContent
                              key={index}
                              value={`case${index + 1}`}
                              className="space-y-4 mt-4"
                            >
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-400">Your Output</h4>
                                <pre className="bg-gray-900 p-3 rounded-md font-mono text-sm">
                                  {result.stdout ? atob(result.stdout) : 'No output'}
                                </pre>
                              </div>
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-400">Expected Output</h4>
                                <pre className="bg-gray-900 p-3 rounded-md font-mono text-sm">
                                  {problem?.test_cases[index]?.output || (result.expected_output ? atob(result.expected_output) : 'No expected output')}
                                </pre>
                              </div>
                              {/* Only show error section if there's a compilation error or runtime error */}
                              {(result.status.id === 6 || // Compilation Error
                                result.status.id === 11 || // Runtime Error
                                result.status.id === 12 || // Time Limit Exceeded
                                result.status.id === 13) && // Memory Limit Exceeded
                                (result.stderr || result.compile_output) && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-red-400">Error</h4>
                                    <pre className="bg-gray-900 p-3 rounded-md font-mono text-sm text-red-400">
                                      {result.stderr ? atob(result.stderr) : result.compile_output ? atob(result.compile_output) : 'No error details available'}
                                    </pre>
                                  </div>
                                )}
                            </TabsContent>
                          ))}
                        </Tabs>
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          No test results yet. Click &quot;Try&quot or &quotSubmit&quot; to run your code.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Panel>
            </PanelGroup>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}