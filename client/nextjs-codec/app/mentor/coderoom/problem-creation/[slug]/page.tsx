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
import { Tab } from '@headlessui/react';
import { motion } from 'framer-motion';
import { ChevronRight, AlertCircle, X } from 'lucide-react';
import { getLanguages } from '@/utilities/rapidApi';
import { Editor } from '@monaco-editor/react';
import dynamic from 'next/dynamic';
import React, { FormEvent, useState } from 'react';
import 'react-quill/dist/quill.snow.css';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';
import { getUser } from '@/lib/auth';
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

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

interface LangArray {
  name: string;
  code_snippet: any;
  time_complexity: number;
  space_complexity: number;
}

type TestCases = {
  input: string;
  output: string;
  is_sample: boolean;
  is_eval: boolean;
  strength: number;
};

export default function Page({ params }: { params: { slug: string } }) {
  const [description, setDescription] = useState<string>('');
  const [constraints, setConstraints] = useState<string>('');
  const [inputFormat, setInputFormat] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<string>('');
  const [codeSnippet, setCodeSnippet] = useState<any>();
  const [selectedLang, setSelectedLang] = useState<string>();
  const [langArray, setLangArray] = useState<LangArray[]>([]);
  const [timeComplexity, setTimeComplexity] = useState<number>();
  const [constraint, setConstraint] = useState<string>();
  const [testCaseInput, setTestCaseInput] = useState<string>();
  const [testCaseOutput, setTestCaseOutput] = useState<string>();
  const [isEval, setIsEval] = useState<boolean>();
  const [isSample, setIsSample] = useState<boolean>();
  const [strength, setStrength] = useState<number>();
  const [testCases, setTestCases] = useState<TestCases[]>([]);
  const [problemName, setProblemName] = useState<string>('');

  const languages = useQuery({
    queryKey: ['languages'],
    queryFn: async () => await getLanguages(),
  });
  const user = useQuery({
    queryKey: ['user'],
    queryFn: async () => await getUser(),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Change from FormData to using state
    if (!problemName || !description || !inputFormat || !outputFormat || !constraints) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (langArray.length === 0) {
      toast({
        title: 'No code snippets added',
        description: 'Please add at least one code snippet',
        variant: 'destructive',
      });
      return;
    }

    if (testCases.length === 0) {
      toast({
        title: 'No test cases added',
        description: 'Please add at least one test case',
        variant: 'destructive',
      });
      return;
    }

    const requestBody = {
      name: problemName,  // Use state value instead of formData
      description: description,
      input_format: inputFormat,
      output_format: outputFormat,
      constraints: constraints,
      release: new Date(2023, 0, 1),
      deadline: new Date(2023, 0, 2),
      languages: langArray,
      test_cases: testCases,
      mentor: user.data.auth.username,
    };

    try {
      const problemResponse = await CreateProblem(requestBody);
      await PostProblem(params.slug, problemResponse.slug);
      toast({
        title: 'Problem created successfully!',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error creating problem',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  function handleAddSnippet() {
    if (
      selectedLang === undefined ||
      codeSnippet === undefined ||
      selectedLang === '' ||
      codeSnippet === ''
    ) {
      toast({
        title: 'Make sure that you selected a language, added a code snippet.',
        variant: 'destructive',
      });
      return;
    }

    const languages: LangArray = {
      name: selectedLang!,
      code_snippet: codeSnippet,
      time_complexity: 500,
      space_complexity: 500,
    };

    // add to language snippets array
    setLangArray([...langArray, languages]);

    // reset state
    setSelectedLang('');
    setCodeSnippet('');

    toast({
      title: 'Added code snippet!',
    });
  }

  function handleAddTestCase() {
    const newTestCases: TestCases = {
      input: testCaseInput!,
      output: testCaseOutput!,
      is_eval: isEval!,
      is_sample: isSample!,
      strength: strength!,
    };

    setTestCases([...testCases, newTestCases]);
  }

  function handleRemoveLangArrayItem(code_snippet: string) {
    setLangArray((prevItems) =>
      prevItems.filter((item) => item.code_snippet !== code_snippet)
    );
  }

  function handleDeleteTestCase(item: any) {
    const newTestCases = testCases.filter((value) => value !== item);
    setTestCases(newTestCases);
  }

  const sections = [
    { name: 'Basic Info', icon: '1' },
    { name: 'Code Template', icon: '2' },
    { name: 'Format & Constraints', icon: '3' },
    { name: 'Test Cases', icon: '4' }
  ];

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="bg-gray-800 rounded-xl shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Problem</h1>

        <form onSubmit={handleSubmit}>
          <Tab.Group>
            <Tab.List className="flex space-x-2 rounded-xl bg-gray-700 p-1 mb-6">
              {sections.map((section) => (
                <Tab
                  key={section.name}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 ring-offset-gray-400 focus:outline-none',
                      selected
                        ? 'bg-gray-900 shadow text-white'
                        : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                    )
                  }
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-700">
                      {section.icon}
                    </span>
                    {section.name}
                  </div>
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels className="mt-2">
              {/* Basic Info Panel */}
              <Tab.Panel className="rounded-xl bg-gray-900 p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Problem Name</label>
                    <input
                      type="text"
                      name="name"
                      value={problemName}
                      onChange={(e) => setProblemName(e.target.value)}
                      className="w-full rounded-lg bg-gray-800 border border-gray-700 p-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Problem Description</label>
                    <ReactQuill
                      value={description}
                      onChange={setDescription}
                      className="bg-gray-800 rounded-lg [&_.ql-toolbar]:bg-gray-700 [&_.ql-container]:bg-gray-800 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-white [&_.ql-toolbar_svg]:text-white [&_.ql-toolbar_button]:text-white [&_.ql-toolbar_.ql-stroke]:stroke-white [&_.ql-toolbar_.ql-fill]:fill-white [&_.ql-toolbar_.ql-picker-label]:text-white"
                      preserveWhitespace={true}
                    />
                  </div>
                </div>
              </Tab.Panel>

              {/* Code Snippets Panel */}
              <Tab.Panel className="rounded-xl bg-gray-900 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="prog-language" className="block text-sm font-medium">Language</label>
                      <Select
                        name="prog-language"
                        onValueChange={(val: string) => setSelectedLang(val)}
                        value={selectedLang}
                        disabled={languages.isLoading}
                      >
                        <SelectTrigger className="w-full bg-gray-800 border-gray-700">
                          <SelectValue placeholder={
                            languages.isLoading
                              ? "Loading languages..."
                              : "Select a language"
                          } />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {languages.isLoading ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : languages.data?.map((lang: { name: string }) => (
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
                      <label className="block text-sm font-medium mb-2">Code Snippet</label>
                      <Editor
                        height="200px"
                        theme="vs-dark"
                        defaultLanguage="plaintext"
                        value={codeSnippet}
                        onChange={setCodeSnippet}
                        className="rounded-lg overflow-hidden"
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
              </Tab.Panel>

              {/* Format & Constraints Panel */}
              <Tab.Panel className="rounded-xl bg-gray-900 p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Constraints</label>
                  <ReactQuill
                    value={constraints}
                    onChange={setConstraints}
                    className="bg-gray-800 rounded-lg [&_.ql-toolbar]:bg-gray-700 [&_.ql-container]:bg-gray-800 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-white [&_.ql-toolbar_svg]:text-white [&_.ql-toolbar_button]:text-white [&_.ql-toolbar_.ql-stroke]:stroke-white [&_.ql-toolbar_.ql-fill]:fill-white [&_.ql-toolbar_.ql-picker-label]:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Input Format</label>
                      <ReactQuill
                        value={inputFormat}
                        onChange={setInputFormat}
                        className="bg-gray-800 rounded-lg [&_.ql-toolbar]:bg-gray-700 [&_.ql-container]:bg-gray-800 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-white [&_.ql-toolbar_svg]:text-white [&_.ql-toolbar_button]:text-white [&_.ql-toolbar_.ql-stroke]:stroke-white [&_.ql-toolbar_.ql-fill]:fill-white [&_.ql-toolbar_.ql-picker-label]:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Output Format</label>
                      <ReactQuill
                        value={outputFormat}
                        onChange={setOutputFormat}
                        className="bg-gray-800 rounded-lg [&_.ql-toolbar]:bg-gray-700 [&_.ql-container]:bg-gray-800 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-white [&_.ql-toolbar_svg]:text-white [&_.ql-toolbar_button]:text-white [&_.ql-toolbar_.ql-stroke]:stroke-white [&_.ql-toolbar_.ql-fill]:fill-white [&_.ql-toolbar_.ql-picker-label]:text-white"
                      />
                    </div>
                  </div>
                </div>
              </Tab.Panel>

              {/* Test Cases Panel */}
              <Tab.Panel className="rounded-xl bg-gray-900 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Test Case Input</label>
                      <textarea
                        value={testCaseInput}
                        onChange={(e) => setTestCaseInput(e.target.value)}
                        className="w-full rounded-lg bg-gray-800 border border-gray-700 p-2 min-h-[150px]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Test Case Output</label>
                      <textarea
                        value={testCaseOutput}
                        onChange={(e) => setTestCaseOutput(e.target.value)}
                        className="w-full rounded-lg bg-gray-800 border border-gray-700 p-2 min-h-[150px]"
                      />
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded bg-gray-800 border-gray-700"
                          onChange={(e) => setIsSample(e.target.checked)}
                        />
                        Is Sample
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded bg-gray-800 border-gray-700"
                          onChange={(e) => setIsEval(e.target.checked)}
                        />
                        Is Eval
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddTestCase}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2"
                    >
                      Add Test Case
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
                              <span className="text-sm font-medium">Test Case #{index + 1}</span>
                              <button
                                onClick={() => handleDeleteTestCase(testCase)}
                                className="text-red-400 hover:text-red-300"
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
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>

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
    </div>
  );
}
