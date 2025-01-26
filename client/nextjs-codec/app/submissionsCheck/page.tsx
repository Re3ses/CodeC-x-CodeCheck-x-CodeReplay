"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ComparisonResults from "@/components/ComparisonResults";
import BorderedContainer from "@/components/ui/wrappers/BorderedContainer";
import SourceCodeViewer from "@/components/ui/comparison-ui/sourceCodeViewer";

interface StoredFile {
  name: string;
  content: string | ArrayBuffer | null;
}

// TODO:
// check file types, accept only text files
// allow for comparison of files
// BASICALLY:
// This page is for code similarity checking (preferably done via local storage) (dont need to store in db)
// Need page in mentor/coderoom/problem
export default function Page() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [formattedSubmissions, setFormattedSubmissions] = useState<any[]>([]);
  const USER_FILE_PREFIX = "user-file-";
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch user-uploaded files from localStorage when the component mounts
    const files = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(USER_FILE_PREFIX)) {
        const value = localStorage.getItem(key);
        files.push({ name: key.replace(USER_FILE_PREFIX, ""), content: value });
      }
    }
    setStoredFiles(files);
  }, []);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleUploadClick = () => {
    if (selectedFiles.length > 0) {
      selectedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          localStorage.setItem(`${USER_FILE_PREFIX}${file.name}`, content);
          setStoredFiles((prevFiles) => [
            ...prevFiles,
            { name: file.name, content },
          ]);
        };
        reader.readAsText(file);
      });
    } else {
      alert("No files selected.");
    }
  };

  const handleClearFiles = () => {
    if (window.confirm('Are you sure you want to clear all uploaded files?')) {
      // Clear files from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(USER_FILE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
      // Reset state
      setStoredFiles([]);
      setSelectedFiles([]);
      setResults(null);
    }
  };

  const handleCompare = async () => {
    setLoading(true);
    try {
      setFormattedSubmissions(storedFiles.map(file => ({
        code: file.content,
        language_used: file.name.endsWith('.py') ? 'python 3.8' : 'java 11',
        learner: file.name.split('.')[0],
      })))

      const res = await fetch("http://127.0.0.1:5000/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          submissions: formattedSubmissions,
          query: {
            tokenizer: "char",
            model: "ts_no-prep",
            detection_type: "model"
          }
        })
      });

      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error('Comparison error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("results:", results);
  }, [results]);

  useEffect(() => {
    if (storedFiles.length > 1) {
      handleCompare();
    }
  }, [storedFiles]);

  return (
    <div className="flex justify-center w-fullz ">
      <div className="flex flex-row w-screen max-w-screen-2xl p-2 gap-2">
        <div className="flex flex-col items-start w-fit">
          <BorderedContainer customStyle="flex flex-col items-start gap-2 p-2">
            <h1 className="font-bold">Submissions Check</h1>
            <p>Upload files for similarity detection.</p>
            <div className="flex flex-col items-start justify-evenly gap-2">
              <BorderedContainer customStyle="flex flex-col p-2 gap-2">
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept="*"
                  multiple
                />
                <Button variant="default" color="primary" onClick={handleUploadClick}>
                  Compare Files
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearFiles}
                  disabled={storedFiles.length === 0}
                >
                  Clear Files
                </Button>
              </BorderedContainer>
            </div>

            <BorderedContainer customStyle="p-2 w-full">
              <h2 className="font-bold mb-2">High Risk Submissions</h2>
              {results && (
                <ul className="list-disc pl-4">
                  {results
                    .filter(result => result.confidence > .75)
                    .map((result, index) => (
                      <li key={index} className="text-red-500">
                        {result.file_name} - {(result.confidence * 100).toFixed(2)}%
                      </li>
                    ))}
                </ul>
              )}
              {results &&
                !results.some(result => result.confidence > .75) && (
                  <p className="text-green-600">No high risk submissions found.</p>
                )}
            </BorderedContainer>

          </BorderedContainer>

          {loading ? (
            ""
          ) : results ? (
            <ComparisonResults comparisonResult={results} />
          ) : null}
        </div>

        {formattedSubmissions ? <SourceCodeViewer submissions={formattedSubmissions} ComparisonResult={results} /> : null}

      </div>
    </div>
  );
}
