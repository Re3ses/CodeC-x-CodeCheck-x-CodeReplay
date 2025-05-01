'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  getLanguages,
  getSubmission,
  postBatchSubmissions,
  postSubmission,
} from '@/utilities/rapidApi';
import { ProblemSchemaInferredType } from '@/lib/interface/problem';
import { getUser } from '@/lib/auth';
import { debounce } from 'lodash';

// Code Replay Imports
import { editor as Monaco } from 'monaco-editor';
import { useQueryClient } from '@tanstack/react-query';

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
  // JAVA: '62',   // Java (OpenJDK 13.0.1)
  // PYTHON: '71', // Python (3.8.1)
  // C: '50',      // C (GCC 9.2.0)
  // CSHARP: '51', // C# (Mono 6.6.0.161)
  // JAVASCRIPT: '63', // JavaScript (Node.js 12.14.1)
} as const;

interface CodeEditorProps {
  userType: 'mentor' | 'learner';
  roomId: string;
  problemId: string;
  dueDate?: string;
}

const DEFAULT_TEMPLATE = `#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`;

export default function CodeEditor({ userType, roomId, problemId, dueDate }: CodeEditorProps) {
  const editorRef = useRef<Monaco.IStandaloneCodeEditor>();
  const queryClient = useQueryClient();

  // State management
  const [problem, setProblem] = useState<ProblemSchemaInferredType>();
  const [editorValue, setEditorValue] = useState<string>(DEFAULT_TEMPLATE);
  const [selectedLang, setSelectedLang] = useState<string>(SUPPORTED_LANGUAGES.CPP);
  const [compileResult, setCompileResult] = useState<any>();
  const [languages, setLanguages] = useState<LanguageData[]>();
  const [inputVal, setInputVal] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [score, setScore] = useState<any>();
  const [batchResult, setBatchResult] = useState<any>();
  const [isInitialized, setIsInitialized] = useState(false);

  const [user, setUser] = useState<any>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [trying, setTrying] = useState(false);

  // Autosave states
  const [lastSaved, setLastSaved] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [enhancedPastes, setEnhancedPastes] = useState<EnhancedPasteInfo[]>([]);
  const [autoSaveToggle, setAutoSaveToggle] = useState<boolean>(false);
  const [codeTemplates, setCodeTemplates] = useState<any[]>([]);

  useEffect(() => {
    setAutoSaveToggle(userType ? userType === 'learner' : false);
  }, [userType]);

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

  const autoSaveCode = useCallback(async (codeToSave: string) => {
    if (codeToSave === lastSaved) return;
    try {
      if (!user) {
        console.warn("User data not yet loaded, skipping auto-save.");
        return;
      }

      const lastVersion = snapshots.length > 0
        ? Math.max(...snapshots.map(snapshot => snapshot.version || 0))
        : 0;

      const nextVersion = lastVersion + 1;

      const saveResponse = await fetch('/api/codereplay/code-snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToSave,
          learner_id: user.id,
          problemId: problemId,
          roomId: roomId,
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
        }
      } else {
        console.error('Auto-save failed:', saveResponse.statusText);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setSaving(false);
    }
    setSaving(false);
  }, [lastSaved, user, snapshots, roomId, problemId]);

  const debouncedAutoSave = useCallback(
    debounce((codeToSave: string) => {
      if (codeToSave === lastSaved || !user) return;
      autoSaveCode(codeToSave);
    }, 10000),
    [lastSaved, user, autoSaveCode]
  );

  useEffect(() => {
    if (!autoSaveToggle) return;

    if (editorValue !== lastSaved) {
      debouncedAutoSave(editorValue);
    }

    const handleVisibilityChange = () => {
      if (document.hidden && editorValue !== lastSaved && user) {
        debouncedAutoSave.cancel();
        autoSaveCode(editorValue);
      }
    };

    const handleBeforeUnload = () => {
      if (editorValue !== lastSaved && user) {
        debouncedAutoSave.cancel();
        autoSaveCode(editorValue);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      debouncedAutoSave.cancel();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, editorValue, autoSaveToggle, lastSaved, debouncedAutoSave, autoSaveCode]);

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;

    editor.onDidPaste((event: any) => {
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

      } catch (error) {
        console.error('Error handling paste event:', error);
      }
    });
  }

  useEffect(() => {
    if (selectedLang && editorRef.current && !isInitialized) {
      const editor = editorRef.current;

      const languageMap: MonacoLanguageMap = {
        [SUPPORTED_LANGUAGES.CPP]: { language: 'cpp' },
        // [SUPPORTED_LANGUAGES.JAVA]: { language: 'java' },
        // [SUPPORTED_LANGUAGES.PYTHON]: { language: 'python' },
        // [SUPPORTED_LANGUAGES.C]: { language: 'c' },
        // [SUPPORTED_LANGUAGES.CSHARP]: { language: 'csharp' },
        // [SUPPORTED_LANGUAGES.JAVASCRIPT]: { language: 'js' },
      };

      const selectedLanguage = languageMap[selectedLang];
      if (selectedLanguage) {
        const model = editor.getModel();
        if (model) {
          Monaco.setModelLanguage(model, selectedLanguage.language);
        }
        setIsInitialized(true);
      } else {
        const model = editor.getModel();
        if (model) {
          Monaco.setModelLanguage(model, "plaintext");
        }
      }
    }
  }, [selectedLang, isInitialized]);

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
      try {
        await SilentLogin();

        const [problemData, languagesData, userData] = await Promise.all([
          GetProblems(problemId),
          getLanguages(),
          getUser()
        ]);

        setProblem(prevState => problemData ? { ...problemData } : prevState);
        setLanguages(prevState => languagesData ? [...languagesData.filter((lang: LanguageData) =>
          // Object.values(SUPPORTED_LANGUAGES).includes(lang.id.toString() as "54" | "62" | "71" | "50" | "51" | "63")
          Object.values(SUPPORTED_LANGUAGES).includes(lang.id.toString() as "54")
        )] : prevState);
        setCodeTemplates(problemData?.languages)
        setUser((prevState: any) => userData ? { ...userData } : prevState);

      } catch (error) {
        console.error('Failed to initialize data:', error);
        toast({
          title: "Error loading data",
          description: "Please refresh the page",
          variant: "destructive",
        });
      }
    };

    initializeData();

  }, [problemId]);

  useEffect(() => {
    const fetchSnapshots = async (learner_id: any) => {
      const response = await fetch(
        `/api/codereplay/code-snapshots?problemId=${problemId}&learner_id=${learner_id}`
      );
      const data = await response.json();

      if (data.success && data.snapshots) {
        const sortedSnapshots = data.snapshots.sort((a: any, b: any) => {
          if (a.version && b.version) {
            return a.version - b.version;
          }
          return 0;
        });

        setSnapshots(sortedSnapshots);
      }
    };

    fetchSnapshots(user?.id)
    setLastSaved(snapshots[snapshots.length - 1]?.code || '');
  }, [user]);

  useEffect(() => {
    setLastSaved(snapshots[snapshots.length - 1]?.code || '');
  }, [snapshots]);

  async function getToken(input: string = '', expected: null | string = null) {
    const data = {
      source_code: btoa(editorValue),
      language_id: +selectedLang!,
      stdin: input != null ? btoa(input) : input,
      expected_output: typeof expected == 'string' ? btoa(expected) : expected,
    };
    return await postSubmission(data).then((res) => res.token);
  }

  const isAfterDueDate = dueDate ? new Date() > new Date(dueDate) : false;

  async function getSubmissionResult(token: string): Promise<any> {
    let result;
    let attempts = 0;
    const maxAttempts = 999;

    while (attempts < maxAttempts) {
      result = await getSubmission(token);

      if (result.status.id !== 1 && result.status.id !== 2) {
        return result;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Submission processing timeout');
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setSaving(true);

      if (!user?.auth?.username || !user?.id || !problemId || !roomId) {
        throw new Error('Missing required user data');
      }

      await autoSaveCode(editorValue);

      if (!problem) {
        throw new Error('Problem data is not loaded');
      }

      const payload = problem.test_cases.map((testCase) => ({
        language_id: +selectedLang!,
        source_code: btoa(editorValue),
        stdin: btoa(testCase.input),
        expected_output: btoa(testCase.output),
      }));

      toast({ title: 'Testing your solution...' });
      const batchSubmissions = await postBatchSubmissions(payload);
      const tokens = batchSubmissions?.map((token: any) => token.token);

      let allComplete = false;
      let attempts = 0;
      const maxAttempts = 100;
      let batchResults;

      while (!allComplete && attempts < maxAttempts) {
        batchResults = await getBatchSubmisisons(tokens.join());

        allComplete = !batchResults.submissions.some(
          (result: any) => result.status.id === 1 || result.status.id === 2
        );

        if (!allComplete) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }

      if (!allComplete) {
        throw new Error('Some submissions are still processing after timeout');
      }

      const testResults: any = [];
      let totalScore = 0;
      let correctTestCases = 0;

      batchResults.submissions.forEach((result: any, i: number) => {
        const testCase = problem.test_cases[i];

        const userOutput = result.stdout ? atob(result.stdout).trim().replace(/\r\n/g, '\n') : '';
        const expectedOutput = testCase.output.trim().replace(/\r\n/g, '\n');
        const isAccepted = userOutput === expectedOutput;

        const testResult = {
          ...result,
          status: {
            ...result.status,
            description: isAccepted ? "Accepted" : "Wrong Answer"
          },
          score: isAccepted ? Number(testCase.score) : 0
        };

        testResults.push(testResult);

        if (isAccepted) {
          totalScore += Number(testCase.score) || 0;
          correctTestCases++;
        }
      });

      const perfectScore = problem.test_cases.reduce((sum, test) => sum + (test.score || 0), 0);

      const submissionData = {
        language_used: selectedLang,
        code: editorValue,
        score: totalScore,
        score_overall_count: totalScore,
        verdict: totalScore > 0 ? 'ACCEPTED' : 'REJECTED',
        user_type: user.type,
        learner: user.auth.username,
        learner_id: user.id,
        problem: problemId,
        room: roomId,
        paste_history: JSON.stringify(enhancedPastes),
        start_time: Number(localStorage.getItem(problemId + '_started')),
        end_time: Date.now(),
        completion_time: Date.now() - Number(localStorage.getItem(problemId + '_started')),
        attempt_count: 1
      };

      const formData = new FormData();
      Object.entries(submissionData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      formData.append('testResults', JSON.stringify(testResults));
      formData.append('problemData', JSON.stringify({
        ...problem,
        perfect_score: perfectScore
      }));

      const response = await fetch('/api/userSubmissions', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to create submission');
      }

      await queryClient.invalidateQueries({
        queryKey: ['submissions', roomId, problemId]
      });

      toast({
        title: "Submission complete",
        description: (
          <div>
            <p>Score: {totalScore}/{perfectScore}</p>
            <p>Correct Test Cases: {correctTestCases}/{problem.test_cases.length}</p>
          </div>
        ),
      });

      // Activate confetti if the score is perfect
      // if (totalScore === perfectScore) {
      //   confetti({
      //     particleCount: 100,
      //     spread: 70,
      //     origin: { y: 0.6 }
      //   });
      // }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit solution",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setSaving(false);
    }
  }

  async function handleTry() {
    try {
      setTrying(true);
      setSaving(true);

      if (!editorValue || !selectedLang) {
        toast({
          title: 'Language and source code should not be empty...',
          variant: 'destructive',
        });
        return;
      }

      await autoSaveCode(editorValue);

      if (showCustomInput) {
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
                ? 'All sample test cases passed!'
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
    finally {
      setTrying(false);
      setSaving(false);
    }
  }

  const VerticalResizeHandle = () => (
    <PanelResizeHandle className="h-1 group hover:h-2 bg-gray-700 hover:bg-[#FFD700] transition-colors cursor-row-resize data-[resize-handle-active]:bg-[#FFD700] flex items-center justify-center z-50">
      <div className="absolute flex items-center justify-center h-4 w-9 bg-gray-700 group-hover:bg-[#FFD700] rounded-md transition-colors">
        <GripHorizontal className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
      </div>
    </PanelResizeHandle>
  );

  const HorizontalResizeHandle = () => (
    <PanelResizeHandle className="w-1 group hover:w-2 bg-gray-700 hover:bg-[#FFD700] transition-colors cursor-col-resize data-[resize-handle-active]:bg-[#FFD700] flex items-center justify-center z-50">
      <div className="absolute flex items-center justify-center w-4 h-9 bg-gray-700 group-hover:bg-[#FFD700] rounded-md transition-colors">
        <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
      </div>
    </PanelResizeHandle>
  );

  const cn = (...args: (string | boolean)[]): string => {
    return args.filter(Boolean).join(' ');
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setSelectedLang(lang);

    let templateCode = '';

    // Map language IDs to template names
    const languageNameMap: Record<string, string> = {
      [SUPPORTED_LANGUAGES.CPP]: "C++ (GCC 9.2.0)",
      // [SUPPORTED_LANGUAGES.JAVA]: "Java (OpenJDK 13.0.1)",
      // [SUPPORTED_LANGUAGES.PYTHON]: "Python (3.8.1)",
      // [SUPPORTED_LANGUAGES.C]: "C (GCC 9.2.0)",
      // [SUPPORTED_LANGUAGES.CSHARP]: "C# (Mono 6.6.0.161)",
      // [SUPPORTED_LANGUAGES.JAVASCRIPT]: "JavaScript (Node.js 12.14.1)",
    };

    const templateName = languageNameMap[lang];
    const template = codeTemplates?.find(template => template.name === templateName);

    if (template?.code_snippet) {
      templateCode = template.code_snippet;
    } else {
      const defaultTemplates: Record<string, string> = {
        [SUPPORTED_LANGUAGES.CPP]: DEFAULT_TEMPLATE,
        // [SUPPORTED_LANGUAGES.PYTHON]: 'print("Hello World!")',
        // [SUPPORTED_LANGUAGES.JAVA]: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
        // [SUPPORTED_LANGUAGES.C]: '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}',
        // [SUPPORTED_LANGUAGES.CSHARP]: 'using System;\n\nclass Program {\n    static void Main() {\n        // Your code here\n    }\n}',
        // [SUPPORTED_LANGUAGES.JAVASCRIPT]: 'function main() {\n    // Your code here\n}\n\nmain();',
      };

      templateCode = defaultTemplates[lang] || '';
    }

    setEditorValue(templateCode);
  };

  return (
    <div className="h-screen bg-gray-900 text-white">
      <PanelGroup direction="horizontal" className="h-full">
        <Panel
          defaultSize={40}
          minSize={20}
          maxSize={80}
          className="overflow-hidden"
        >
          <div className="flex flex-col h-full overflow-auto">
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

            <div className="bg-gray-800 p-4 rounded-lg mx-3 mb-3">
              <h2 className="text-lg font-semibold mb-3 text-[#FFD700]">Sample Cases</h2>
              <div className="space-y-4">
                {problem?.test_cases
                  .filter(test => test.is_sample)
                  .map((test, index) => (
                    <div key={index} className="space-y-3">
                      <div className="bg-gray-900 p-3 rounded">
                        <h3 className="text-sm font-semibold mb-2 text-[#FFD700]">
                          Sample Input {index + 1}
                        </h3>
                        <pre className="font-mono text-sm whitespace-pre-wrap">
                          {test.input}
                        </pre>
                      </div>
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

        <Panel
          defaultSize={60}
          minSize={20}
          maxSize={80}
          className="overflow-hidden"
        >
          <div className="flex flex-col h-full">
            <div className="bg-gray-800 p-3 flex justify-between items-center">
              <div className="flex items-center">
                <select
                  className="bg-gray-900 text-white px-4 py-2 rounded-md border border-gray-700 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]"
                  value={selectedLang}
                  onChange={handleLanguageChange}
                >
                  {languages?.filter(lang =>
                    // Object.values(SUPPORTED_LANGUAGES).includes(lang.id.toString() as "54" | "62" | "71" | "50" | "51" | "63")
                    Object.values(SUPPORTED_LANGUAGES).includes(lang.id.toString() as "54")
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
                  disabled={trying}
                  className="flex items-center gap-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black"
                >
                  <Zap className="w-4 h-4" />
                  Try
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    handleSubmit();
                    setShowCustomInput(false);
                  }}
                  disabled={isAfterDueDate || submitting}
                  className={cn(
                    isAfterDueDate && "cursor-not-allowed opacity-50"
                  )}
                >
                  {isAfterDueDate ? "Submission Closed" : "Submit"}
                </Button>
              </div>
            </div>
            <PanelGroup direction="vertical" className="flex-1">
              <Panel defaultSize={70} minSize={30}>
                <div className="h-full bg-gray-900">
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    defaultLanguage="cpp"
                    value={editorValue}
                    onChange={(value) => setEditorValue(value || '')}
                    onMount={handleEditorDidMount}
                    options={{
                      fontSize: 14,
                      readOnly: submitting || trying,
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

              <VerticalResizeHandle />

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
                          No test results yet. Click &quot;Try&quot; or &quot;Submit&quot; to run your code.
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
