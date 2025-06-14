'use client';

import { useState } from 'react';

export default function AgreementAnalysis() {
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [aggregate, setAggregate] = useState<boolean>(false);
  const [statistics, setStatistics] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      setError('Please select at least one CSV file');
      return;
    }

    setLoading(true);
    setError(null);
    setImage(null);
    setStatistics(null);

    const formData = new FormData();
    
    // Append each file to formData
    files.forEach((file) => {
      formData.append('file', file); // Changed from 'files[]' to 'file'
    });
    
    formData.append('aggregate', String(aggregate));

    try {
      const response = await fetch('http://localhost:5000/analyze_agreement', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setImage(data.plot);
      setStatistics(data.statistics);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Add validation for file types
  const validateFiles = (files: FileList | null): boolean => {
    if (!files || files.length === 0) return false;

    for (let i = 0; i < files.length; i++) {
      if (!files[i].name.endsWith('.csv')) {
        setError('Please upload only CSV files');
        return false;
      }
    }
    return true;
  };

  // Save image function
  const saveImage = () => {
    if (!image) return;
    
    // Get the original filename from the last uploaded file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const files = fileInput?.files;
    let filename = 'agreement-analysis';
    
    if (files && files.length > 0) {
      // Get the name of the last uploaded file without extension
      const lastFile = files[files.length - 1];
      filename = lastFile.name.replace(/\.csv$/i, '');
    }
    
    // Create a link element
    const link = document.createElement('a');
    
    // Set the href to the base64 image data
    link.href = `data:image/png;base64,${image}`;
    
    // Set the download filename
    link.download = `${filename}.png`;
    
    // Append link to the body
    document.body.appendChild(link);
    
    // Trigger the download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Agreement Analysis</h1>
      
      <div className="space-y-4">
        {/* File Upload Instructions */}
        <div className="text-sm text-gray-600 mb-4">
          <p>Please upload one or more CSV files with the following columns:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>tool_name (CodeCheck, MOSS, or Dolos)</li>
            <li>file1 (first file name)</li>
            <li>file2 (second file name)</li>
            <li>similarity_score (numeric value)</li>
            <li>problem_set_id (optional, required for aggregation)</li>
          </ul>
        </div>

        {/* Aggregation Toggle */}
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            id="aggregate"
            checked={aggregate}
            onChange={(e) => setAggregate(e.target.checked)}
            className="rounded text-yellow-600 focus:ring-yellow-500"
          />
          <label htmlFor="aggregate" className="text-sm text-gray-700">
            Aggregate results across problem sets
          </label>
        </div>

        {/* File Upload Input */}
        <div className="mb-6">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              if (validateFiles(e.target.files)) {
                handleFileUpload(e);
              }
            }}
            disabled={loading}
            multiple
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-yellow-50 file:text-yellow-700
              hover:file:bg-yellow-100
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-2 text-sm text-gray-500">
            {aggregate ? 
              "Upload multiple CSV files to aggregate results across problem sets" :
              "Upload a single CSV file for individual analysis"
            }
          </p>
        </div>

        {/* Action buttons */}
        {(image || statistics || error) && (
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => {
                setImage(null);
                setStatistics(null);
                setError(null);
              }}
              className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
            >
              Clear Results
            </button>
            
            {image && (
              <button
                onClick={saveImage}
                className="px-4 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                Download Image
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-blue-600 mb-4">
            Analyzing files, please wait...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {(image || statistics) && (
          <div className="border rounded-lg p-4 space-y-4">
            
            {/* Analysis Plot */}
            {image && (
              <div>
                <img 
                  src={`data:image/png;base64,${image}`} 
                  alt="Agreement Analysis" 
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}