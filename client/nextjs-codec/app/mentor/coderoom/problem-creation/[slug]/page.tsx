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
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

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
  const [description, setDescription] = useState<string>();
  const [codeSnippet, setCodeSnippet] = useState<any>();
  const [selectedLang, setSelectedLang] = useState<string>();
  const [langArray, setLangArray] = useState<LangArray[]>([]);
  const [timeComplexity, setTimeComplexity] = useState<number>();
  const [constraint, setConstraint] = useState<string>();
  const [inputFormat, setInputFormat] = useState<string>();
  const [outputFormat, setOutputFormat] = useState<string>();
  const [testCaseInput, setTestCaseInput] = useState<string>();
  const [testCaseOutput, setTestCaseOutput] = useState<string>();
  const [isEval, setIsEval] = useState<boolean>();
  const [isSample, setIsSample] = useState<boolean>();
  const [strength, setStrength] = useState<number>();
  const [testCases, setTestCases] = useState<TestCases[]>([]);

  const languages = useQuery({
    queryKey: ['languages'],
    queryFn: async () => await getLanguages(),
  });
  const user = useQuery({
    queryKey: ['user'],
    queryFn: async () => await getUser(),
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name');

    const requestBody = {
      name: name,
      description: description,
      input_format: inputFormat,
      output_format: outputFormat,
      constraints: constraint,
      release: new Date(2023, 0, 1),
      deadline: new Date(2023, 0, 2),
      languages: langArray,
      test_cases: testCases,
      mentor: user.data.auth.username,
    };

    console.log(user.data);

    await CreateProblem(requestBody).then(async (val) => {
      await PostProblem(params.slug, val.slug).then(() => {
        toast({
          title: 'Problem created!',
        });
      });
    });
  }

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
    setLangArray((prevItems) => prevItems.filter(item => item.code_snippet !== code_snippet))
  }

  return (
    <div className="container p-4">
      <form onSubmit={onSubmit} className="flex flex-col justify-start gap-4">
        <div>
          <label htmlFor="name">Problem name</label>
          <Input type="text" name="name" required />
        </div>

        <div>
          <label htmlFor="description">Problem description</label>
          <ReactQuill
            theme="snow"
            value={description}
            onChange={setDescription}
          />
        </div>

        <div className="grid grid-cols-2 divide-x mt-4">
          <div className='p-2'>
            {/* Code snippet */}
            <div className="flex flex-col gap-4 ml-4">
              <Select
                name="prog-language"
                onValueChange={(val) => setSelectedLang(val)}
                value={selectedLang}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.data?.map((val: any) => {
                    return (
                      <SelectItem value={val.name} key={val.name}>
                        {val.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Editor
                className="min-h-[150px] max-h-[400px]"
                theme="vs-dark"
                defaultLanguage="plaintext"
                defaultValue={`code snippet here`}
                value={codeSnippet}
                onChange={(val) => setCodeSnippet(val)}
                options={{
                  automaticLayout: true,
                  lineNumbers: 'on',
                }}
              />
              <Button
                onClick={handleAddSnippet}
                type="button"
                variant={'outline'}
              >
                Add code snippet
              </Button>
            </div>
            {/* == end code snippet == */}
          </div>
          {/* Code snippet preview */}
          <div className='flex flex-col gap-2 p-2'>
            <small>Click item to preview</small>
            <div className="flex gap-2 flex-wrap align-top justify-start h-fit">
              {langArray.map((element: LangArray) => {
                return (
                  <Dialog key={element.name}>
                    <DialogTrigger
                      className={buttonVariants({ variant: 'default' })}
                    >
                      {element.name}
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogDescription className='p-2'>
                          <small>{element.name} Code snippet</small>
                          <SafeHtml html={element.code_snippet} className='mb-2 p-2 rounded-md border border-slate-500' />
                          <Button variant={"destructive"} className='float-right' onClick={() => handleRemoveLangArrayItem(element.code_snippet)}>Remove</Button>
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          </div>
          {/* == end code snippet preview == */}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="constraints">Constraints</label>
            <ReactQuill
              theme="snow"
              value={constraint}
              onChange={setConstraint}
            />
          </div>
          <div className="grid grid-rows-2 gap-4">
            <div>
              <label htmlFor="input-format">Input format</label>
              <ReactQuill
                theme="snow"
                value={inputFormat}
                onChange={setInputFormat}
              />
            </div>
            <div>
              <label htmlFor="output-format">Output format</label>
              <ReactQuill
                theme="snow"
                value={outputFormat}
                onChange={setOutputFormat}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label>Test case input</label>
              <textarea
                value={testCaseInput}
                onChange={(e) => setTestCaseInput(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label>Test case output</label>
              <textarea
                value={testCaseOutput}
                onChange={(e) => setTestCaseOutput(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="sample"
                  onCheckedChange={(val: boolean) => setIsSample(val)}
                />
                <label htmlFor="sample">Is sample</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="eval"
                  onCheckedChange={(val: boolean) => setIsEval(val)}
                />
                <label htmlFor="eval">Is eval</label>
              </div>
            </div>
            <div>
              <Button
                className="w-fit"
                onClick={handleAddTestCase}
                type="button"
                variant={'outline'}
              >
                Add testcase
              </Button>
            </div>
          </div>
          <div className="overflow-y-scroll overflow-x-scroll text-center max-h-[250px] border-2 border-[white] rounded-md">
            <table className="w-full">
              <tr>
                <th>Input</th>
                <th>Expected output</th>
              </tr>
              {testCases.map((val: TestCases, index: number) => {
                return (
                  <tr key={index}>
                    <td>{val.input}</td>
                    <td>{val.output}</td>
                  </tr>
                );
              })}
            </table>
          </div>
        </div>

        <div>
          <Button
            className="w-fit float-right"
            type="submit"
            variant={'secondary'}
          >
            Create problem
          </Button>
        </div>
      </form>
    </div>
  );
}
