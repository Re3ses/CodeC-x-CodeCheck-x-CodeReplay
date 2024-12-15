"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ComparisonResults from "@/components/ComparisonResults";
import BorderedContainer from "@/components/ui/wrappers/BorderedContainer";



// TODO:
// check file types, accept only text files
// allow for comparison of files
// BASICALLY:
// This page is for code similarity checking (preferably done via local storage) (dont need to store in db)
// Need page in mentor/coderoom/problem
export default function Page() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [storedFiles, setStoredFiles] = useState([]);
  const USER_FILE_PREFIX = "user-file-"; // Prefix to identify user-uploaded files
  const [results, setResults] = useState(null);
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
      const formattedSubmissions = storedFiles.map(file => ({
        code: file.content,
        language_used: file.name.endsWith('.py') ? 'Python' : 'Java',
        learner: file.name.split('.')[0],
      }));

      const res = await fetch("http://127.0.0.1:5000/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          submissions: formattedSubmissions,
          query: {
            tokenizer: "char",
            model: "default",
            detection_type: "comparison"
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
    if (storedFiles.length > 1) {
      handleCompare();
    }
  }, [storedFiles]);

  return (
    <div className="flex flex-col items-center">
      <BorderedContainer customStyle="flex flex-row items-start justify-center w-fit mx-4">
        <BorderedContainer customStyle="flex flex-col items-start p-4 gap-2">
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
            </BorderedContainer>
            {/* <Button variant="default" color="secondary" onClick={handleCompare}>
              Compare Files
            </Button> */}
          </div>
        </BorderedContainer>

        {loading ? (
          ""
        ) : results ? (
          <ComparisonResults comparisonResult={results} />
        ) : null}

        <BorderedContainer customStyle="flex flex-col items-start p-4 min-w-[100px]">
          <div className="flex justify-start items-center gap-2">
            <h2 className="font-bold">Files</h2>
            <Button
              variant="destructive"
              onClick={handleClearFiles}
              disabled={storedFiles.length === 0}
            >
              Clear Files
            </Button>
          </div>
          <ul className="m-3">
            {storedFiles.map((file, index) => (
              <li key={index}>
                {file.name.split('.')[0]} {file.name.split('.').pop()?.toLowerCase()}
              </li>
            ))}
          </ul>
        </BorderedContainer>
      </BorderedContainer>
    </div>
  );
}
