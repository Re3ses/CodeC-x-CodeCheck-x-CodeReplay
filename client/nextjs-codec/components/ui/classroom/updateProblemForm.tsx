'use client';
import React, { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Editor } from '@monaco-editor/react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ChevronRight, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

// Define language and test case types
interface LangArray {
  name: string;
  code_snippet: string;
  time_complexity: number;
  space_complexity: number;
}

interface TestCase {
  is_eval: boolean;
  input: string;
  output: string;
  is_sample: boolean;
  score: number;
}

interface ProblemData {
  _id: string;
  name: string;
  description: string;
  input_format: string;
  output_format: string;
  constraints: string;
  languages: LangArray[];
  test_cases: TestCase[];
  mentor: string;
  perfect_score: number;
}

// Define form schema with Zod
const problemSchema = z.object({
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
  })).min(1, "At least one language is required"),
  test_cases: z.array(z.object({
    input: z.string(),
    output: z.string().min(1, "Output is required"),
    score: z.number().min(0),
    is_sample: z.boolean(),
    is_eval: z.boolean()
  })).min(1, "At least one test case is required")
});

type ProblemFormData = z.infer<typeof problemSchema>;

const SUPPORTED_LANGUAGES = [
  { id: 54, name: 'C++ (GCC 9.2.0)', extension: 'cpp' },
  { id: 62, name: 'Java (OpenJDK 13.0.1)', extension: 'java' },
  { id: 71, name: 'Python (3.8.1)', extension: 'py' },
  { id: 50, name: 'C (GCC 9.2.0)', extension: 'c' },
  { id: 88, name: 'C# (Mono 6.6.0.161)', extension: 'cs' },
  { id: 63, name: 'Javascript (Node.js 12.14.1)', extension: 'js' }
];

const DEFAULT_SNIPPETS = {
  'C++ (GCC 9.2.0)': '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}',
  'Java (OpenJDK 13.0.1)': 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
  'Python (3.8.1)': '# Your code here',
  'C (GCC 9.2.0)': '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}',
  'C# (Mono 6.6.0.161)': 'using System;\n\nclass Program {\n    static void Main(string[] args) {\n        // Your code here\n    }\n}',
  'Javascript (Node.js 12.14.1)': 'function main() {\n    // Your code here\n}\n\nmain();'
};

interface UpdateProblemFormProps {
  onFormSubmit: (success: boolean) => void;
  problem: ProblemData;
}

export default function UpdateProblemForm({ onFormSubmit, problem }: UpdateProblemFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);

  // State for adding new language
  const [selectedLang, setSelectedLang] = useState<string>(SUPPORTED_LANGUAGES[0].name);
  const [codeSnippet, setCodeSnippet] = useState<string>(
    DEFAULT_SNIPPETS[SUPPORTED_LANGUAGES[0].name as keyof typeof DEFAULT_SNIPPETS]
  );

  // State for adding new test case
  const [newTestCase, setNewTestCase] = useState({
    input: '',
    output: '',
    is_sample: false,
    score: 10
  });

  // Initialize the form with problem data
  const form = useForm<ProblemFormData>({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      name: problem.name,
      description: problem.description,
      input_format: problem.input_format,
      output_format: problem.output_format,
      constraints: problem.constraints,
      languages: problem.languages,
      test_cases: problem.test_cases
    }
  });

  // Setup field arrays for languages and test cases
  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } =
    useFieldArray({ control: form.control, name: "languages" });

  const { fields: testCaseFields, append: appendTestCase, remove: removeTestCase } =
    useFieldArray({ control: form.control, name: "test_cases" });

  // Calculate perfect score
  const calculatePerfectScore = () => {
    return form.getValues().test_cases.reduce((total, testCase) => total + testCase.score, 0);
  };

  const handleAddLanguage = useCallback(() => {
    if (!selectedLang || !codeSnippet) {
      toast({
        title: 'Make sure you have selected a language and added a code snippet.',
        variant: 'destructive',
      });
      return;
    }

    // Check if language already exists
    if (form.getValues().languages.some(lang => lang.name === selectedLang)) {
      toast({
        title: 'Language already added',
        description: 'This language template has already been added.',
        variant: 'destructive',
      });
      return;
    }

    appendLanguage({
      name: selectedLang,
      code_snippet: codeSnippet,
      time_complexity: 500,
      space_complexity: 500,
    });

    toast({ title: 'Language template added successfully!' });
  }, [selectedLang, codeSnippet, appendLanguage, form, toast]);

  const handleAddTestCase = useCallback(() => {
    if (!newTestCase.output) {
      toast({
        title: 'Missing test case details',
        description: 'Please provide output for the test case',
        variant: 'destructive',
      });
      return;
    }

    appendTestCase({
      input: newTestCase.input,
      output: newTestCase.output,
      is_sample: newTestCase.is_sample,
      is_eval: false,
      score: newTestCase.score,
    });

    // Reset form
    setNewTestCase({
      input: '',
      output: '',
      is_sample: false,
      score: 10
    });

    toast({ title: 'Test case added successfully!' });
  }, [newTestCase, appendTestCase, toast]);

  const onSubmit = async (data: ProblemFormData) => {
    try {
      // Prepare payload for the update
      const payload = {
        problem_id: problem._id,
        ...data,
        perfect_score: calculatePerfectScore()
      };

      const response = await fetch('/api/problems', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update problem');
      }

      setSuccess(true);
      queryClient.refetchQueries({ queryKey: ['problems'] });
      queryClient.refetchQueries({ queryKey: ['problem', problem._id] });

      onFormSubmit(true);

      toast({
        title: 'Problem updated successfully',
        description: 'Your changes have been saved',
      });
    } catch (error) {
      console.error('Update problem error:', error);
      onFormSubmit(false);
      toast({
        title: 'Error',
        description: 'Failed to update problem',
        variant: 'destructive',
      });
    }
  };

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'bullet' }],
    ],
  };

  const sections = [
    { name: 'Basic Info', icon: '1' },
    { name: 'Code Template', icon: '2' },
    { name: 'Format & Constraints', icon: '3' },
    { name: 'Test Cases', icon: '4' }
  ];

  const ReactQuillEditor = React.memo(({ value, onChange }: { value: string, onChange: (value: string) => void }) => {
    return (
      <ReactQuill
        value={value}
        onChange={onChange}
        modules={quillModules}
        formats={['bold', 'italic', 'underline', 'list']}
        className="bg-gray-800 rounded-lg [&_.ql-toolbar]:bg-gray-700 [&_.ql-container]:bg-gray-800 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-white [&_.ql-toolbar_svg]:text-white [&_.ql-toolbar_button]:text-white [&_.ql-toolbar_.ql-stroke]:stroke-white [&_.ql-toolbar_.ql-fill]:fill-white [&_.ql-toolbar_.ql-picker-label]:text-white"
        preserveWhitespace={true}
      />
    );
  });
  ReactQuillEditor.displayName = "ReactQuillEditor";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="Basic Info">
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
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Problem Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter problem name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Problem Description</FormLabel>
                    <FormControl>
                      <ReactQuillEditor value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormDescription>
                      Describe the problem statement in detail
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Code Template Panel */}
          <TabsContent value="Code Template" className="rounded-xl bg-gray-900 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={selectedLang}
                    onValueChange={val => {
                      setSelectedLang(val);
                      setCodeSnippet(DEFAULT_SNIPPETS[val as keyof typeof DEFAULT_SNIPPETS] || '');
                    }}
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
                  <Label>Code Snippet</Label>
                  <Editor
                    height="200px"
                    theme="vs-dark"
                    defaultLanguage={SUPPORTED_LANGUAGES.find(lang => lang.name === selectedLang)?.extension || 'cpp'}
                    value={codeSnippet}
                    onChange={(value) => setCodeSnippet(value || '')}
                    className="rounded-lg overflow-hidden mt-2"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      automaticLayout: true,
                      scrollBeyondLastLine: false
                    }}
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleAddLanguage}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2"
                >
                  Add Code Snippet
                </Button>
              </div>

              <div>
                <Label>Current Language Templates</Label>
                <div className="bg-gray-800 rounded-lg p-4 min-h-[200px] border border-gray-700 mt-2">
                  <div className="flex flex-wrap gap-2">
                    {languageFields.map((lang, index) => (
                      <motion.div
                        key={lang.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-700 rounded-lg p-2 flex items-center gap-2"
                      >
                        <span>{form.getValues().languages[index].name}</span>
                        <button
                          type="button"
                          onClick={() => removeLanguage(index)}
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
            <FormField
              control={form.control}
              name="constraints"
              render={({ field }) => (
                <FormItem className="mb-6">
                  <FormLabel>Constraints</FormLabel>
                  <FormControl>
                    <ReactQuillEditor value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormDescription>
                    Specify constraints on inputs and processing
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="input_format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Input Format</FormLabel>
                    <FormControl>
                      <ReactQuillEditor value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormDescription>
                      Describe the format of inputs to the problem
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="output_format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Output Format</FormLabel>
                    <FormControl>
                      <ReactQuillEditor value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormDescription>
                      Describe the expected format of outputs
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Test Cases Panel */}
          <TabsContent value="Test Cases" className="rounded-xl bg-gray-900 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Test Cases</h2>
              <div className="bg-gray-800 px-4 py-2 rounded-lg flex items-center gap-2">
                <span className="text-sm text-gray-400">Perfect Score:</span>
                <span className="text-lg font-bold text-green-400">{calculatePerfectScore()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Test Case Input</Label>
                  <Textarea
                    value={newTestCase.input}
                    onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                    className="w-full min-h-[150px] mt-2"
                    placeholder="Enter input for this test case"
                  />
                </div>

                <div>
                  <Label>Test Case Output</Label>
                  <Textarea
                    value={newTestCase.output}
                    onChange={(e) => setNewTestCase({ ...newTestCase, output: e.target.value })}
                    className="w-full min-h-[150px] mt-2"
                    placeholder="Enter expected output for this test case"
                  />
                </div>

                <div className="space-y-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="space-y-2">
                    <Label className="text-base">Test Case Score</Label>
                    <div className="flex gap-4 items-center">
                      <div className="flex-grow">
                        <Slider
                          value={[newTestCase.score]}
                          max={100}
                          min={0}
                          step={1}
                          className="w-full"
                          onValueChange={(value) => setNewTestCase({ ...newTestCase, score: value[0] })}
                        />
                      </div>
                      <Input
                        type="number"
                        value={newTestCase.score}
                        onChange={(e) => setNewTestCase({ ...newTestCase, score: Number(e.target.value) })}
                        className="w-20 bg-gray-700 border-gray-600"
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Sample Test Case?</Label>
                      <div className="text-sm text-gray-400">
                        Make this test case visible to users as an example
                      </div>
                    </div>
                    <Switch
                      checked={newTestCase.is_sample}
                      onCheckedChange={(checked) => setNewTestCase({ ...newTestCase, is_sample: checked })}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddTestCase}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Test Case</span>
                </Button>
              </div>

              <div>
                <Label>Current Test Cases</Label>
                <div className="bg-gray-800 rounded-lg p-4 min-h-[400px] border border-gray-700 overflow-y-auto mt-2">
                  {testCaseFields.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No test cases added yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {testCaseFields.map((testCase, index) => (
                        <motion.div
                          key={testCase.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-gray-700 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="space-y-1">
                              <span className="text-sm font-medium">Test Case #{index + 1}</span>
                              <div className="flex gap-2">
                                {form.getValues().test_cases[index].is_sample && (
                                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                                    Sample
                                  </span>
                                )}
                                {form.getValues().test_cases[index].is_eval && (
                                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">
                                    Evaluation
                                  </span>
                                )}
                                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                                  Score: {form.getValues().test_cases[index].score}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTestCase(index)}
                              className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-400/10"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-sm space-y-2">
                            <div className="bg-gray-800 p-2 rounded">
                              <div className="text-gray-400">Input:</div>
                              <div className="font-mono">{form.getValues().test_cases[index].input}</div>
                            </div>
                            <div className="bg-gray-800 p-2 rounded">
                              <div className="text-gray-400">Output:</div>
                              <div className="font-mono">{form.getValues().test_cases[index].output}</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={success}
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-2"
          >
            Update Problem
          </Button>
        </div>
      </form>
    </Form>
  );
}