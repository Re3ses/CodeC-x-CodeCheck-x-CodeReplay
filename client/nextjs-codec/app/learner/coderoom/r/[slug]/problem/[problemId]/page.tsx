'use client';

import React, { useEffect, useState, useRef, FormEvent } from 'react';
import { GetProblems } from '@/utilities/apiService';
import {
  getBatchSubmisisons,
  getLanguage,
  getLanguages,
  getSubmission,
  postBatchSubmissions,
  postSubmission,
} from '@/utilities/rapidApi';
import { ProblemSchemaInferredType } from '@/lib/interface/problem';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import 'react-quill/dist/quill.core.css';
import { Switch } from '@/components/ui/switch';
import axios from 'axios';
import { useParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { LightningBoltIcon } from '@radix-ui/react-icons';
import { getUser } from '@/lib/auth';
import languagesCode from '@/utilities/languages_code.json';
import SafeHtml from '@/components/SafeHtml';

type languageData = {
  id: number;
  name: string;
};

export default function Page() {
  const editorRef = useRef(null);

  const params = useParams<{ slug: string; problemId: string }>();
  const [problem, setProblem] = useState<ProblemSchemaInferredType>();
  const [editorValue, setEditorValue] = useState<any>();
  const [selectedLang, setSelectedLang] = useState<string>();
  const [compileResult, setCompileResult] = useState<any>();
  const [languages, setLanguages] = useState<languageData[]>();
  const [inputVal, setInputVal] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [score, setScore] = useState<any>();
  const [batchResult, setBatchResult] = useState<any>();
  const [learner, setLearner] = useState<string>();
  const [hasSubmittedRequest, setHasSubmittedRequest] =
    useState<boolean>(false);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [completionTime, setCompletionTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const langCodes: LanguageCodes = languagesCode;

  useEffect(() => {
    // set start time on mount
    if (!localStorage.getItem(params.problemId + '_started')) {
      localStorage.setItem(
        params.problemId + '_started',
        Date.now().toString()
      );
    }

    const res: () => Promise<ProblemSchemaInferredType> = async () => {
      return await GetProblems(params.problemId);
    };
    res().then((result) => setProblem(result));

    const lang: () => Promise<languageData[]> = async () => {
      return await getLanguages();
    };
    lang().then((result) => setLanguages(result));

    const user: () => Promise<any> = async () => {
      return await getUser();
    };
    user().then((result) => setLearner(result.id));
  }, [params.problemId]);

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
  }

  /**
   * @param input - standard input / custom input
   * @param expected - expected return type
   * @returns token, used for getting submissions from judge0
   */
  async function getToken(input: string = '', expected: null | string = null) {
    const data = {
      source_code: btoa(editorValue),
      language_id: +selectedLang!,
      stdin: input != null ? btoa(input) : input,
      expected_output: typeof expected == 'string' ? btoa(expected) : expected,
    };
    const token = await postSubmission(data).then((res) => {
      return res.token;
    });
    return token;
  }

  // TODO: Prevent spam
  // Submits to db, checks for isTest flag
  async function handleSubmit(isTest: boolean = true) {
    if (editorValue == '' || selectedLang == undefined) {
      toast({
        title: 'Language and source code should not be empty...',
        variant: 'destructive',
      });
      return;
    }

    var eval_problems;
    if (isTest == false) {
      eval_problems = problem?.test_cases.filter((item) => item.is_eval);
    } else {
      // evals should not be empty
      eval_problems = problem?.test_cases.filter((item) => item.is_sample);
    }
    const payload: {
      language_id: number;
      source_code: string;
      stdin: null | string;
      expected_output: null | string;
    }[] =
      eval_problems?.map((val) => {
        return {
          language_id: +selectedLang!,
          source_code: btoa(editorValue),
          stdin: btoa(val.input),
          expected_output: btoa(val.output),
        };
      }) || [];

    if (payload.length == 0) {
      toast({
        title:
          'Cannot test, problem setter did not provide any sample cases. Use custom input instead',
        variant: 'destructive',
      });
      return;
    }

    const submission_message = isTest
      ? 'Testing submission'
      : 'Processing submission';
    toast({ title: submission_message });
    const submissions = await postBatchSubmissions(payload);
    const tokens: { token: string }[] = submissions?.map((token: any) => {
      return token.token;
    });

    // Submits to judge0 for eval
    setTimeout(async () => {
      try {
        setAttemptCount(attemptCount + 1);
        // Set completion time here, mark as valid if problem is completed

        const batchSubmissions = await getBatchSubmisisons(tokens.join());
        setBatchResult(batchSubmissions.submissions);

        const accepted = batchSubmissions.submissions.filter(
          (obj: any) => obj.status.description === 'Accepted'
        );

        const score = {
          accepted_count: accepted.length,
          overall_count: batchSubmissions.submissions.length,
        };
        setScore(score);

        const status_message = isTest
          ? 'Test program posted'
          : 'Submission posted';
        toast({ title: status_message });

        const language_used = await getLanguage(+selectedLang);

        if (score.accepted_count == score.overall_count) {
          toast({ title: 'Congrats! All test case passed!' });
          localStorage.setItem(
            params.problemId + '_ended',
            Date.now().toString()
          );
        }

        // if not test, submit and post attempt to db
        if (!isTest) {
          let start_time: number = 0;
          let end_time: number = 0;

          try {
            if (localStorage.getItem(params.problemId + '_started') !== null) {
              start_time = parseInt(localStorage.getItem(
                params.problemId + '_started'
              )!);
              setStartTime(start_time);

              // == debug ==
              console.log('start_time', start_time);
              // == end debug ==
            }

            if (localStorage.getItem(params.problemId + '_ended') !== null) {
              end_time = parseInt(localStorage.getItem(params.problemId + '_ended')!);
              setEndTime(end_time);

              // == debug ==
              console.log('end_time', end_time);
              // == end debug ==
            }
          } catch (e) {
            console.error('local storage problem', e);
            alert("Local storage not supported, contact support for help...");
            return;
          }

          console.log('hello');

          const data = {
            language_used: language_used.name,
            code: editorValue,
            score: score.accepted_count,
            score_overall_count: score.overall_count,
            verdict:
              score.overall_count == score.accepted_count
                ? 'ACCEPTED'
                : 'REJECTED',
            learner: learner,
            problem: params.problemId,
            room: params.slug,
            attempt_count: attemptCount,
            start_time: start_time,
            end_time: end_time,
            completion_time: end_time - start_time,
          };

          // === debug ===
          console.log(data);
          // === end debug ===

          const url = `${process.env.NEXT_PUBLIC_SERVER_URL}${process.env.NEXT_PUBLIC_SERVER_PORT}/api/userSubmissions/`;
          console.log("url", url)
          await axios.postForm(url, data);
        }
      } catch (e) {
        console.error('error occured posting to db', e);
      }
    }, 3000);
  }

  // against custom input
  async function handleTry() {
    if (showCustomInput && inputVal == '') {
      toast({ title: 'No input detected...', variant: 'destructive' });
      return;
    }

    if (showCustomInput) {
      // handle with custom input
      const token = await getToken(inputVal);

      toast({ title: 'Try submitted, please wait for result' });

      setTimeout(async () => {
        const compileResult = await getSubmission(token);
        setCompileResult(compileResult);
        toast({ title: 'Successfully compiled!' });
      }, 3000);
    } else {
      // handle submit as test input
      handleSubmit(true);
    }
  }

  return (
    <PanelGroup direction="horizontal">
      <Panel className="min-w-[20em] overflow-scroll flex flex-col gap-2">
        <div className="p-3 bg-zinc-900">
          <p>Problem description</p>
        </div>

        {/* TODO: Make problem preview into component */}
        <div className="p-3 flex-1 overflow-auto">
          <div
            className="text-sm
                          [&_li]:list-decimal
                          [&_li]:ml-8
                          [&_li]:py-2
                          [&_code]:bg-[#1E1E1E]
                          [&_code]:p-1
                          [&_h4]:font-bold"
          >
            <SafeHtml
              className="text-center font-bold pb-2"
              html={problem?.name!}
            />
            <SafeHtml className="pb-2" html={problem?.description!} />
            <SafeHtml className="pb-2" html={problem?.constraints!} />
            <SafeHtml className="pb-2" html={problem?.input_format!} />
            <SafeHtml className="pb-2" html={problem?.output_format!} />
          </div>
        </div>
        <div className="p-3">
          <p className="bg-zinc-900 p-3 rounded-t-lg">Sample cases</p>
          <table className="w-full">
            <tr>
              <th>Sample input</th>
              <th>Sample output</th>
            </tr>
            {problem?.test_cases.map((val: any, index: number) => {
              if (val.is_sample) {
                return (
                  <tr
                    className={index % 2 == 0 ? '' : 'bg-zinc-900'}
                    key={index}
                  >
                    <td>{val.input}</td>
                    <td>{val.output}</td>
                  </tr>
                );
              }
            })}
          </table>
        </div>
        <div className="flex flex-col p-3">
          <div className="flex gap-2 bg-zinc-900 p-3 rounded-t-lg">
            <p>Custom input</p>
            <Switch
              checked={showCustomInput}
              onCheckedChange={setShowCustomInput}
            />
          </div>
          <textarea
            className={`${
              showCustomInput ? 'block' : 'hidden'
            } p-3 bg-zinc-800`}
            rows={8}
            name="custom-input"
            id="custom-input"
            placeholder="Custom input here"
            value={inputVal}
            onChange={(e) => setInputVal(e.currentTarget.value)}
          />
        </div>
      </Panel>
      <PanelResizeHandle className="bg-zinc-700 w-[2px]" />
      <Panel>
        <PanelGroup direction="vertical" className="flex flex-col flex-1">
          <Panel className="flex-1 flex flex-col min-h-[10em]">
            <div className="flex justify-between bg-zinc-900 p-3">
              <div className="flex gap-2 my-auto">
                <div>
                  <select
                    className="p-2 rounded-md"
                    name="languages"
                    form="submit-form"
                    onChange={(e) => {
                      setSelectedLang(e.currentTarget.value);
                    }}
                    required
                  >
                    <option value="">None</option>
                    {languages?.map((val) => {
                      return (
                        <option value={val.id} key={val.id}>
                          {val.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleTry()}>Try</Button>
                <Button
                  onClick={() => {
                    handleSubmit(false);
                    setShowCustomInput(false);
                  }}
                >
                  Submit
                </Button>
              </div>
            </div>
            <div className="h-full">
              <Editor
                theme="vs-dark"
                defaultLanguage="plaintext"
                language={langCodes[String(selectedLang)]}
                onMount={handleEditorDidMount}
                onChange={setEditorValue}
              />
            </div>
          </Panel>
          <PanelResizeHandle className="bg-zinc-700 h-[2px]" />
          <Panel className="h-[20em] overflow-scroll flex min-h-[10em]">
            <div className="flex-1 overflow-scroll whitespace-pre-wrap">
              {showCustomInput ? (
                compileResult?.status.id != 3 ? (
                  <>{compileResult?.stderr}</>
                ) : (
                  <>
                    <div>
                      <p className="bg-zinc-900/70 p-3 sticky top-0 backdrop-blur-sm">
                        Output
                      </p>
                      <p className="p-3">{atob(compileResult?.stdout)}</p>
                    </div>
                  </>
                )
              ) : (
                <>
                  <p className="bg-zinc-900 p-3">
                    Result | Accepted: {score?.accepted_count}/
                    {score?.overall_count}
                  </p>
                  <div className="p-3">
                    {batchResult?.map((val: any, index: number) => {
                      return (
                        <p
                          className={`${index % 2 ? 'bg-zinc-700' : ''} ${
                            val.status.description !== 'Accepted'
                              ? 'text-[red]'
                              : ''
                          }`}
                          key={index}
                        >
                          Case: {index} - {val.status.description}
                        </p>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}
