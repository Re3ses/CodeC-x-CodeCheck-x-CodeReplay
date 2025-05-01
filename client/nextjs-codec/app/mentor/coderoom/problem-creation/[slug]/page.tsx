'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { CreateProblem, PostProblem } from '@/utilities/apiService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from 'framer-motion';
import { ChevronRight, AlertCircle, X } from 'lucide-react';
import { getLanguages } from '@/utilities/rapidApi';
import { Editor } from '@monaco-editor/react';
import dynamic from 'next/dynamic';
import React, { FormEvent, useState, useRef } from 'react';
import 'react-quill/dist/quill.snow.css';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';
import { getUser } from '@/lib/auth';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import SafeHtml from '@/components/SafeHtml';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from 'next/navigation';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface LangArray {
  name: string;
  code_snippet: any;
  time_complexity: number;
  space_complexity: number;
}

type TestCases = {
  is_eval: boolean;
  input: string;
  output: string;
  is_sample: boolean;
  score: number;
};

interface ProblemData {
  name: string;
  description: string;
  input_format: string;
  output_format: string;
  constraints: string;
  languages: LangArray[];
  test_cases: TestCases[];
  mentor: string;
  perfect_score: number;
  release: Date;
  deadline: Date;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  input_format: z.string().min(1, "Input format is required"),
  output_format: z.string().min(1, "Output format is required"),
  constraints: z.string().min(1, "Constraints are required"),
  languages: z.array(z.object({
    name: z.string(),
    code_snippet: z.string(),
    time_complexity: z.number(),
    space_complexity: z.number()
  })),
  test_cases: z.array(z.object({
    input: z.string().min(1, "Input is required"),
    output: z.string().min(1, "Output is required"),
    score: z.number().min(0, "Score must be non-negative"),
    is_sample: z.boolean().default(false),
    is_eval: z.boolean().default(false)
  }))
});

const TestCaseControls = React.forwardRef(({
  onSampleChange,
  onScoreChange,
  defaultScore = 10
}: {
  onSampleChange: (value: boolean) => void;
  onScoreChange: (value: number) => void;
  defaultScore?: number;
}, ref) => {
  const [score, setScore] = useState(defaultScore);
  const [isSampleChecked, setIsSampleChecked] = useState(false);

  React.useImperativeHandle(ref, () => ({
    resetControls: () => {
      setScore(defaultScore);
      setIsSampleChecked(false);
      onSampleChange(false);
      onScoreChange(defaultScore);
    }
  }));

  const handleScoreChange = (value: number[]) => {
    setScore(value[0]);
    onScoreChange?.(value[0]);
  };

  const handleSampleChange = (checked: boolean) => {
    setIsSampleChecked(checked);
    onSampleChange(checked);
  };

  return (
    <div className="space-y-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base">Test Case Score</Label>
          <div className="flex gap-4 items-center">
            <div className="flex-grow">
              <Slider
                defaultValue={[score]}
                max={100}
                min={0}
                step={1}
                className="w-full"
                onValueChange={handleScoreChange}
              />
            </div>
            <Input
              type="number"
              value={score}
              onChange={(e) => handleScoreChange([Number(e.target.value)])}
              className="w-20 bg-gray-700 border-gray-600"
              min={0}
              max={100}
            />
          </div>
          <div className="text-sm text-gray-400">
            Points awarded for passing this test case (0-100)
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Sample Test Case?</Label>
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <span>Make this test case visible to users as an example</span>
            </div>
          </div>
          <Switch
            checked={isSampleChecked}
            onCheckedChange={handleSampleChange}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
      </div>
    </div>
  );
});

TestCaseControls.displayName = 'TestCaseControls';

const SUPPORTED_LANGUAGES = [
  { id: 54, name: 'C++ (GCC 9.2.0)', extension: 'cpp' },
  { id: 62, name: 'Java (OpenJDK 13.0.1)', extension: 'java' },
  { id: 71, name: 'Python (3.8.1)', extension: 'py' },
  { id: 50, name: 'C (GCC 9.2.0)', extension: 'c' },
  { id: 88, name: 'C# (Mono 6.6.0.161)', extension: 'cs' },
  { id: 63, name: 'Javascript (Node.js 12.14.1)', extension: 'js' }
];

const DEFAULT_SNIPPETS = {
  'C++ (GCC 11.2.0)': '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}',
  'Java (OpenJDK 17.0.6)': 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
  'Python (3.11.2)': '# Your code here',
  'C (GCC 11.2.0)': '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}',
  'C# (Mono 6.12.0)': 'using System;\n\nclass Program {\n    static void Main(string[] args) {\n        // Your code here\n    }\n}',
  'Javascript (Node.js 16.13.0)': 'function main() {\n    // Your code here\n}\n\nmain();'
};

export default function Page({ params }: { params: { slug: string } }) {
  const [description, setDescription] = useState<string>('');
  const [constraints, setConstraints] = useState<string>('');
  const [inputFormat, setInputFormat] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<string>(SUPPORTED_LANGUAGES[0].name);
  const [codeSnippet, setCodeSnippet] = useState<string>(DEFAULT_SNIPPETS[SUPPORTED_LANGUAGES[0].name as keyof typeof DEFAULT_SNIPPETS]);
  const [langArray, setLangArray] = useState<LangArray[]>([]);
  const [timeComplexity, setTimeComplexity] = useState<number>();
  const [constraint, setConstraint] = useState<string>();
  const [testCaseInput, setTestCaseInput] = useState<string>("");
  const [testCaseOutput, setTestCaseOutput] = useState<string>();
  const [isEval, setIsEval] = useState<boolean>(false);
  const [isSample, setIsSample] = useState<boolean>(false);
  const [testCaseScore, setTestCaseScore] = useState<number>(10);
  const [testCases, setTestCases] = useState<TestCases[]>([]);
  const [problemName, setProblemName] = useState<string>('');
  const [perfectScore, setPerfectScore] = useState<number>(0);
  const testCaseControlsRef = useRef<{ resetControls: () => void }>(null);
  const router = useRouter();
  const [missingFieldsState, setMissingFieldsState] = useState({
    problemName: false,
    description: false,
    inputFormat: false,
    outputFormat: false,
    constraints: false,
    testCaseInput: false,
    testCaseOutput: false,
    codeSnippet: false,
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      input_format: '',
      output_format: '',
      constraints: '',
      languages: [],
      test_cases: [],
    }
  });

  const user = useQuery({
    queryKey: ['user'],
    queryFn: async () => await getUser(),
  });

  const calculatePerfectScore = (testCases: TestCases[]) => {
    return testCases.reduce((total, testCase) => total + testCase.score, 0);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const missingFields = {
      problemName: !problemName,
      description: !description,
      inputFormat: !inputFormat,
      outputFormat: !outputFormat,
      constraints: !constraints,
      testCaseInput: testCases.length === 0,
      testCaseOutput: testCases.length === 0,
      codeSnippet: langArray.length === 0,
    };

    setMissingFieldsState(missingFields);

    if (Object.values(missingFields).some(Boolean)) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const requestBody: ProblemData = {
      name: problemName,
      description: description,
      input_format: inputFormat,
      output_format: outputFormat,
      constraints: constraints,
      release: new Date(2023, 0, 1),
      deadline: new Date(2023, 0, 2),
      languages: langArray,
      test_cases: testCases,
      mentor: user.data.auth.username,
      perfect_score: perfectScore
    };

    try {
      const problemResponse = await CreateProblem(requestBody);
      await PostProblem(params.slug, problemResponse.slug);
      toast({
        title: 'Problem created successfully!',
        variant: 'default',
      });

      // Navigate back to the coderoom
      router.push(`/mentor/coderoom/r/${params.slug}`);
    } catch (error) {
      toast({
        title: 'Error creating problem',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  function handleAddSnippet() {
    if (!selectedLang || !codeSnippet) {
      toast({
        title: 'Make sure you have selected a language and added a code snippet.',
        variant: 'destructive',
      });
      return;
    }

    const languages: LangArray = {
      name: selectedLang,
      code_snippet: codeSnippet,
      time_complexity: 500,
      space_complexity: 500,
    };

    // Check if language already exists
    if (langArray.some(lang => lang.name === selectedLang)) {
      toast({
        title: 'Language already added',
        description: 'This language template has already been added.',
        variant: 'destructive',
      });
      return;
    }

    setLangArray([...langArray, languages]);

    // // Don't reset the selection, just show success message
    // toast({
    //   title: 'Added code snippet!',
    // });
  }

  function handleAddTestCase() {
    if (!testCaseOutput) {
      toast({
        title: 'Missing test case details',
        description: 'Please provide output for the test case',
        variant: 'destructive',
      });
      return;
    }

    const newTestCase: TestCases = {
      input: testCaseInput,
      output: testCaseOutput,
      is_sample: isSample,
      score: testCaseScore,
      is_eval: false,
    };

    const updatedTestCases = [...testCases, newTestCase];
    setTestCases(updatedTestCases);
    setPerfectScore(calculatePerfectScore(updatedTestCases));

    // Reset form
    setTestCaseInput('');
    setTestCaseOutput('');
    setIsSample(false);
    setTestCaseScore(10);

    // Also reset the Switch in TestCaseControls
    if (testCaseControlsRef.current) {
      testCaseControlsRef.current.resetControls();
    }

    toast({
      title: 'Test case added successfully!',
    });
  }

  function handleRemoveLangArrayItem(code_snippet: string) {
    setLangArray((prevItems) =>
      prevItems.filter((item) => item.code_snippet !== code_snippet)
    );
  }

  function handleDeleteTestCase(item: TestCases) {
    setTestCases((prevTestCases) => {
      const updatedTestCases = prevTestCases.filter((testCase) => testCase !== item);
      setPerfectScore(calculatePerfectScore(updatedTestCases));
      return updatedTestCases;
    });
  }

  const sections = [
    { name: 'Basic Info', icon: '1' },
    { name: 'Code Template', icon: '2' },
    { name: 'Format & Constraints', icon: '3' },
    { name: 'Test Cases', icon: '4' }
  ];

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'bullet' }],
      // ['clean'], // remove formatting button
    ],
  };

  const quillFormats = ['bold', 'italic', 'underline', 'list'];


  return (
    <div className="container max-w-7xl mx-auto p-6 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl shadow-xl p-6 min-w-fit">
        <h1 className="text-2xl font-bold mb-6">Create New Problem</h1>

        <form onSubmit={handleSubmit}>
          <Tabs
            defaultValue='Basic Info'>
            <TabsList className="flex flex-wrap h-auto space-x-2 rounded-xl bg-gray-700 p-1 mb-6">
              {sections.map((section) => (
                <TabsTrigger
                  key={section.name}
                  value={section.name}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center justify-center gap-2 text-wrap">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-700">
                      {section.icon}
                    </span>
                    {section.name}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Basic Info Panel */}
            <TabsContent value="Basic Info" className="rounded-xl bg-gray-900 p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Problem Name
                    {missingFieldsState.problemName &&
                      <sup className="ml-1 text-xs text-red-400 font-normal">*required</sup>
                    }
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={problemName}
                    onChange={(e) => {
                      setProblemName(e.target.value);
                      if (e.target.value) {
                        setMissingFieldsState(prev => ({ ...prev, problemName: false }));
                      }
                    }}
                    className="w-full rounded-lg bg-gray-800 border border-gray-700 p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Problem Description
                    {missingFieldsState.description &&
                      <sup className="ml-1 text-xs text-red-400 font-normal">*required</sup>
                    }
                  </label>
                  <ReactQuill
                    value={description}
                    onChange={(e) => {
                      setDescription(e);
                      setMissingFieldsState(prev => ({ ...prev, description: false }));
                    }}
                    modules={quillModules}
                    formats={quillFormats}
                    className="min-h-[10vh] bg-gray-800 rounded-lg [&_.ql-toolbar]:bg-gray-700 [&_.ql-container]:bg-gray-800 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-white [&_.ql-toolbar_svg]:text-white [&_.ql-toolbar_button]:text-white [&_.ql-toolbar_.ql-stroke]:stroke-white [&_.ql-toolbar_.ql-fill]:fill-white [&_.ql-toolbar_.ql-picker-label]:text-white"
                    preserveWhitespace={true}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Code Template Panel */}
            <TabsContent value="Code Template" className="rounded-xl bg-gray-900 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="prog-language" className="block text-sm font-medium">Language</label>
                    <Select
                      name="prog-language"
                      onValueChange={(val: string) => {
                        setSelectedLang(val);
                        setCodeSnippet(DEFAULT_SNIPPETS[val as keyof typeof DEFAULT_SNIPPETS]);
                      }}
                      value={selectedLang}
                    >
                      <SelectTrigger className="w-full bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <SelectItem
                            key={lang.name}
                            value={lang.name}
                            className="hover:bg-gray-700 focus:bg-gray-700"
                          >
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Code Snippet
                      {missingFieldsState.codeSnippet &&
                        <sup className="ml-1 text-xs text-red-400 font-normal">*required</sup>
                      }
                    </label>
                    <Editor
                      height="200px"
                      theme="vs-dark"
                      defaultLanguage={SUPPORTED_LANGUAGES.find(lang => lang.name === selectedLang)?.extension || 'cpp'}
                      value={codeSnippet}
                      onChange={(value) => setCodeSnippet(value || '')}
                      className="rounded-lg overflow-hidden"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        automaticLayout: true,
                        scrollBeyondLastLine: false
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSnippet}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2"
                  >
                    Add Code Snippet
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Added Snippets</label>
                  <div className="bg-gray-800 rounded-lg p-4 min-h-[200px] border border-gray-700">
                    <div className="flex flex-wrap gap-2">
                      {langArray.map((lang) => (
                        <motion.div
                          key={lang.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-700 rounded-lg p-2 flex items-center gap-2"
                        >
                          <span>{lang.name}</span>
                          <button
                            onClick={() => handleRemoveLangArrayItem(lang.code_snippet)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ×
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Format & Constraints Panel */}
            <TabsContent value="Format & Constraints" className="rounded-xl bg-gray-900 p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Constraints
                  {missingFieldsState.constraints &&
                    <sup className="ml-1 text-xs text-red-400 font-normal">*required</sup>
                  }
                </label>
                <ReactQuill
                  modules={quillModules}
                  formats={quillFormats}
                  value={constraints}
                  onChange={(e) => {
                    setConstraints(e);
                    setMissingFieldsState(prev => ({ ...prev, constraints: false }));
                  }}
                  className="bg-gray-800 rounded-lg [&_.ql-toolbar]:bg-gray-700 [&_.ql-container]:bg-gray-800 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-white [&_.ql-toolbar_svg]:text-white [&_.ql-toolbar_button]:text-white [&_.ql-toolbar_.ql-stroke]:stroke-white [&_.ql-toolbar_.ql-fill]:fill-white [&_.ql-toolbar_.ql-picker-label]:text-white"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Input Format
                      {missingFieldsState.inputFormat &&
                        <sup className="ml-1 text-xs text-red-400 font-normal">*required</sup>
                      }
                    </label>
                    <ReactQuill
                      modules={quillModules}
                      formats={quillFormats}
                      value={inputFormat}
                      onChange={(e) => {
                        setInputFormat(e);
                        setMissingFieldsState(prev => ({ ...prev, inputFormat: false }));
                      }}
                      className="bg-gray-800 rounded-lg [&_.ql-toolbar]:bg-gray-700 [&_.ql-container]:bg-gray-800 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-white [&_.ql-toolbar_svg]:text-white [&_.ql-toolbar_button]:text-white [&_.ql-toolbar_.ql-stroke]:stroke-white [&_.ql-toolbar_.ql-fill]:fill-white [&_.ql-toolbar_.ql-picker-label]:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Output Format
                      {missingFieldsState.outputFormat &&
                        <sup className="ml-1 text-xs text-red-400 font-normal">*required</sup>
                      }
                    </label>
                    <ReactQuill
                      modules={quillModules}
                      formats={quillFormats}
                      value={outputFormat}
                      onChange={(e) => {
                        setOutputFormat(e);
                        setMissingFieldsState(prev => ({ ...prev, outputFormat: false }));
                      }}
                      className="bg-gray-800 rounded-lg [&_.ql-toolbar]:bg-gray-700 [&_.ql-container]:bg-gray-800 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-white [&_.ql-toolbar_svg]:text-white [&_.ql-toolbar_button]:text-white [&_.ql-toolbar_.ql-stroke]:stroke-white [&_.ql-toolbar_.ql-fill]:fill-white [&_.ql-toolbar_.ql-picker-label]:text-white"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Test Cases Panel */}
            <TabsContent value="Test Cases" className="rounded-xl bg-gray-900 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Test Cases</h2>
                <div className="bg-gray-800 px-4 py-2 rounded-lg flex items-center gap-2">
                  <span className="text-sm text-gray-400">Perfect Score:</span>
                  <span className="text-lg font-bold text-green-400">{perfectScore}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Test Case Input
                      {missingFieldsState.testCaseOutput &&
                        <sup className="ml-1 text-xs text-red-400 font-normal">*required</sup>
                      }
                    </label>
                    <textarea
                      value={testCaseInput}
                      onChange={(e) => {
                        setTestCaseInput(e.target.value);
                        setMissingFieldsState(prev => ({ ...prev, testCaseOutput: false }));
                      }}
                      className="w-full rounded-lg bg-gray-800 border border-gray-700 p-2 min-h-[150px]"
                      placeholder="Enter input for this test case"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Test Case Output
                      {missingFieldsState.testCaseOutput &&
                        <sup className="ml-1 text-xs text-red-400 font-normal">*required</sup>
                      }
                    </label>
                    <textarea
                      value={testCaseOutput}
                      onChange={(e) => {
                        setTestCaseOutput(e.target.value);
                        setMissingFieldsState(prev => ({ ...prev, testCaseOutput: false }));
                      }}
                      className="w-full rounded-lg bg-gray-800 border border-gray-700 p-2 min-h-[150px]"
                      placeholder="Enter expected output for this test case"
                    />
                  </div>

                  <TestCaseControls
                    ref={testCaseControlsRef}
                    onSampleChange={setIsSample}
                    onScoreChange={setTestCaseScore}
                    defaultScore={10}
                  />

                  <button
                    type="button"
                    onClick={handleAddTestCase}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 flex items-center justify-center gap-2"
                  >
                    <span>Add Test Case</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Added Test Cases</label>
                  <div className="bg-gray-800 rounded-lg p-4 min-h-[400px] border border-gray-700 overflow-y-auto">
                    <div className="space-y-2">
                      {testCases.map((testCase, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-gray-700 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="space-y-1">
                              <span className="text-sm font-medium">Test Case #{index + 1}</span>
                              <div className="flex gap-2">
                                {testCase.is_sample && (
                                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                                    Sample
                                  </span>
                                )}
                                {testCase.is_eval && (
                                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">
                                    Evaluation
                                  </span>
                                )}
                                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                                  Score: {testCase.score}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteTestCase(testCase)}
                              className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-400/10"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-sm space-y-2">
                            <div className="bg-gray-800 p-2 rounded">
                              <div className="text-gray-400">Input:</div>
                              <div className="font-mono">{testCase.input}</div>
                            </div>
                            <div className="bg-gray-800 p-2 rounded">
                              <div className="text-gray-400">Output:</div>
                              <div className="font-mono">{testCase.output}</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-2 flex items-center gap-2"
            >
              Create Problem
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div >
  );
}
