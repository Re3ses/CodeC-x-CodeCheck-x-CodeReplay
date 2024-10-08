"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [storedFiles, setStoredFiles] = useState([]);

  const USER_FILE_PREFIX = "user-file-"; // Prefix to identify user-uploaded files

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

          // Save to localStorage with a unique prefix
          localStorage.setItem(`${USER_FILE_PREFIX}${file.name}`, content);

          // Update the stored files list
          setStoredFiles((prevFiles) => [
            ...prevFiles,
            { name: file.name, content },
          ]);

          alert(`File ${file.name} stored in localStorage!`);
        };
        reader.readAsDataURL(file); // You can also use readAsText based on your file type
      });
    } else {
      alert("No files selected.");
    }
  };

  return (
    <div className="flex flex-row items-center justify-around">
      <div>
        <h1>Submissions Check</h1>
        <p>Upload java files for similarity detection.</p>
        <div className="flex flex-col items-center justify-evenly">
          <Button variant="default" color="primary">
            Submit
          </Button>
          <div>
            <label htmlFor="file-upload">Upload Files:</label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              accept="*"
              multiple
            />

            <Button variant="default" color="secondary" onClick={handleUploadClick}>
              Upload and compare
            </Button>
          </div>
        </div>
      </div>
      <div>
        <h2>Submissions</h2>
        <p>Display submissions here</p>
        <ul className="m-3">
          {storedFiles.map((file, index) => (
            <li key={index}>
              {file.name} - {file.content.substring(0, 50)}...
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
