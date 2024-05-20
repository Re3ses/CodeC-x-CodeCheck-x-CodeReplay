"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { CreateProblem, PostProblem } from "@/utilities/apiService"
import { getLanguages } from "@/utilities/rapidApi"
import { Editor } from "@monaco-editor/react"
import dynamic from "next/dynamic"
import React, { useState } from "react"
import "react-quill/dist/quill.snow.css"
import { Switch } from "@/components/ui/switch"
import { useQuery } from "@tanstack/react-query"
import { getUser } from "@/lib/auth"

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false })

export default function page({ params }) {
    const [description, setDescription] = useState()
    const [codeSnippet, setCodeSnippet] = useState()
    const [selectedLang, setSelectedLang] = useState()
    const [langArray, setLangArray] = useState([])
    const [timeComplexity, setTimeComplexity] = useState()
    const [constraint, setConstraint] = useState()
    const [inputFormat, setInputFormat] = useState()
    const [outputFormat, setOutputFormat] = useState()
    const [testCaseInput, setTestCaseInput] = useState()
    const [testCaseOutput, setTestCaseOutput] = useState()
    const [isEval, setIsEval] = useState()
    const [isSample, setIsSample] = useState()
    const [strength, setStrength] = useState()
    const [testCases, setTestCases] = useState([])

    const languages = useQuery({
        queryKey: ["languages"],
        queryFn: async () => await getLanguages()
    })
    const user = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser()
    })

    async function onSubmit(event) {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const name = formData.get("name")

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
            mentor: user.data?.id
        }

        await CreateProblem(requestBody).then(async val => {
            await PostProblem(params.slug, val.slug).then(() => {
                toast({
                    title: "Problem created!"
                })
            })
        })
    }

    function handleAddSnippet() {
        if (
            selectedLang === undefined ||
            codeSnippet === undefined ||
            timeComplexity === undefined ||
            selectedLang === "" ||
            codeSnippet === ""
        ) {
            toast({
                title:
                    "Make sure that you selected a language, added a code snippet, or added complexities.",
                variant: "destructive"
            })
            return 1
        }

        const languages = {
            name: selectedLang,
            code_snippet: codeSnippet,
            time_complexity: timeComplexity,
            space_complexity: 1000
        }

        setLangArray([...langArray, languages])
        setSelectedLang("")
        setCodeSnippet("")

        toast({
            title: "Added code snippet!"
        })
    }

    function handleAddTestCase() {
        const newTestCases = {
            input: testCaseInput,
            output: testCaseOutput,
            is_eval: isEval,
            is_sample: isSample,
            strength: strength
        }

        setTestCases([...testCases, newTestCases])
    }

    return (
        // todo: make this carousel/paginated
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
                    <div className="flex flex-col gap-4 mr-4 justify-center">
                        <div>
                            <label htmlFor="time-complexity">
                                Time complexity (In milliseconds)
                            </label>
                            <Input
                                type="number"
                                name="time-complexity"
                                placeholder="(e.g., 500)"
                                onChange={e => setTimeComplexity(+e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex flex-col gap-4 ml-4">
                            <Select
                                name="prog-language"
                                onValueChange={val => setSelectedLang(val)}
                                value={selectedLang}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    {languages.data?.map(val => {
                                        return <SelectItem value={val.name}>{val.name}</SelectItem>
                                    })}
                                </SelectContent>
                            </Select>
                            <Editor
                                className="min-h-[150px] max-h-[400px]"
                                theme="vs-dark"
                                defaultLanguage="plaintext"
                                defaultValue={`code snippet here`}
                                value={codeSnippet}
                                onChange={val => setCodeSnippet(val)}
                                options={{
                                    automaticLayout: true,
                                    lineNumbers: "on"
                                }}
                            />
                            <Button
                                onClick={handleAddSnippet}
                                type="button"
                                variant={"outline"}
                            >
                                Add code snippet
                            </Button>
                        </div>
                    </div>
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
                                onChange={e => setTestCaseInput(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label>Test case output</label>
                            <textarea
                                value={testCaseOutput}
                                onChange={e => setTestCaseOutput(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <Switch id="sample" onCheckedChange={val => setIsSample(val)} />
                                <label htmlFor="sample">Is sample</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="eval" onCheckedChange={val => setIsEval(val)} />
                                <label htmlFor="eval">Is eval</label>
                            </div>
                        </div>
                        <div>
                            <Button
                                className="w-fit"
                                onClick={handleAddTestCase}
                                type="button"
                                variant={"outline"}
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
                            {testCases.map(val => {
                                return (
                                    <tr>
                                        <td>{val.input}</td>
                                        <td>{val.output}</td>
                                    </tr>
                                )
                            })}
                        </table>
                    </div>
                </div>

                <div>
                    <Button
                        className="w-fit float-right"
                        type="submit"
                        variant={"secondary"}
                    >
                        Create problem
                    </Button>
                </div>
            </form>
        </div>
    )
}

