"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ComparisonResults from "./comparisonResults/results";


// TODO:
// check file types, accept only text files
// allow for comparison of files
// BASICALLY:
// This page is for code similarity checking (preferably done via local storage) (dont need to store in db)
// Need page in mentor/coderoom/problem
export default function Page() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const getFiles = async () => {
    console.log("Fetching submissions");
    const res = await fetch("/api/userSubmissions?all=true&single=true");
    const data = await res.json();
    console.log(data, data.submission)
    setFiles(data.submission);
  }

  const handleCompare = async () => {
    setLoading(true);
    console.log("Comparing files");
    getFiles();

    const res = await fetch("http://127.0.0.1:5000/compare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        submissions: files,
        query: {
          tokenizer: "char",
          model: "default",
          detection_type: "comparison"
        }
      })
    });
    const data = await res.json();
    console.log("data:", data);
    setResults(data);
    setLoading(false);
  }

  return (
    <div>
      <Button onClick={handleCompare} disabled={loading}>Compare</Button>
      <ComparisonResults comparisonResult={results} />
    </div>
  );
}

