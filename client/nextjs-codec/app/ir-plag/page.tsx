'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface AnalysisResults {
  accuracyPlagiarized: number;
  precisionPlagiarized: number;
  recallPlagiarized: number;
  f1ScorePlagiarized: number;
  accuracyNonPlagiarized: number;
  precisionNonPlagiarized: number;
  recallNonPlagiarized: number;
  f1ScoreNonPlagiarized: number;
  confusionMatrixPlagiarized: {
    truePositives: number;
    falseNegatives: number;
  };
  confusionMatrixNonPlagiarized: {
    trueNegatives: number;
    falsePositives: number;
  };
  totalComparisons: number;
  processedFiles: number;
}

export default function IRPlagValidation() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [currentCase, setCurrentCase] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [confusionMatrixUrl, setConfusionMatrixUrl] = useState<string | null>(null);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    setResults(null);
    setConfusionMatrixUrl(null);

    try {
      console.log('Starting analysis...');
      const response = await fetch('/api/ir-plag/analyze', {
        method: 'POST',
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Analysis failed with status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        console.log('Received chunk:', text);

        try {
          const lines = text.split('\n').filter(line => line.trim());
          for (const line of lines) {
            const data = JSON.parse(line);
            console.log('Parsed data:', data);

            if (data.completed) {
              console.log('Analysis completed');
              setIsAnalyzing(false);
            }
            if (data.progress !== undefined) {
              setProgress(data.progress);
            }
            if (data.currentFile) {
              setCurrentFile(data.currentFile);
              setCurrentCase(data.caseId);
              setFileType(data.type);
              console.log(`Processing ${data.type} file in case ${data.caseId}:`, data.currentFile);
            }
            if (data.results) {
              setResults(data.results);
              console.log('Final results:', data.results);

              // Fetch confusion matrix graph
              const matrixResponse = await fetch('/api/confusion-matrix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matrix: data.results.confusionMatrixPlagiarized })
              });

              if (matrixResponse.ok) {
                const blob = await matrixResponse.blob();
                const url = URL.createObjectURL(blob);
                setConfusionMatrixUrl(url);
              } else {
                console.error('Failed to fetch confusion matrix graph');
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing chunk:', parseError);
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">IR-Plag Dataset Validation</h1>
          <Button 
            onClick={startAnalysis}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
          </Button>
        </div>
  
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Progress Section */}
        <Card className="bg-gray-800/50 border-0">
          <CardHeader>
            <CardTitle>Analysis Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-2" />
            <p className="mt-2 text-sm text-gray-400">
              {isAnalyzing 
                ? `Processing... ${progress.toFixed(1)}%`
                : results 
                  ? 'Analysis complete'
                  : 'Ready to start'}
            </p>
            {isAnalyzing && currentFile && (
              <div className="mt-2 text-sm">
                <p className="text-blue-400">Case: {currentCase}</p>
                <p className="text-gray-400">Type: {fileType}</p>
                <p className="text-gray-400 truncate">File: {currentFile}</p>
              </div>
            )}
          </CardContent>
        </Card>
  
{/* Mean F1-Score Section */}
{results && (
  <Card className="bg-gray-800/50 border-0">
    <CardHeader>
      <CardTitle className="text-center">Overall Performance</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col items-center justify-center text-center">
        {/* Mean Score (Center) */}
        <div className="flex flex-col items-center mb-4">
          <div className="text-5xl font-bold text-blue-400">
            {((results.f1ScorePlagiarized + results.f1ScoreNonPlagiarized) / 2 * 100).toFixed(1)}%
          </div>
          <p className="text-lg text-gray-400 mt-1">Mean F1-Score</p>
        </div>
        
        {/* Description Text (Center) */}
        <div className="max-w-md mx-auto">
          <p className="text-sm text-gray-500">
            Balanced harmonic mean of precision and recall across both plagiarized and non-plagiarized submissions
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
        
        {/* Results Section */}
        {results && (
          <>
            {/* Plagiarized Metrics */}
            <Card className="bg-gray-800/50 border-0">
              <CardHeader>
                <CardTitle>Plagiarized Submissions Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard 
                    title="Accuracy" 
                    value={results.accuracyPlagiarized * 100} 
                    description="Overall correctness"
                  />
                  <MetricCard 
                    title="Precision" 
                    value={results.precisionPlagiarized * 100}
                    description="True positives ratio"
                  />
                  <MetricCard 
                    title="Recall" 
                    value={results.recallPlagiarized * 100}
                    description="Sensitivity"
                  />
                  <MetricCard 
                    title="F1 Score" 
                    value={results.f1ScorePlagiarized * 100}
                    description="Harmonic mean"
                  />
                </div>
              </CardContent>
            </Card>
  
            {/* Non-Plagiarized Metrics */}
            <Card className="bg-gray-800/50 border-0">
              <CardHeader>
                <CardTitle>Non-Plagiarized Submissions Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard 
                    title="Accuracy" 
                    value={results.accuracyNonPlagiarized * 100} 
                    description="Overall correctness"
                  />
                  <MetricCard 
                    title="Precision" 
                    value={results.precisionNonPlagiarized * 100}
                    description="True negatives ratio"
                  />
                  <MetricCard 
                    title="Recall" 
                    value={results.recallNonPlagiarized * 100}
                    description="Specificity"
                  />
                  <MetricCard 
                    title="F1 Score" 
                    value={results.f1ScoreNonPlagiarized * 100}
                    description="Harmonic mean"
                  />
                </div>
              </CardContent>
            </Card>
  
  {/* Confusion Matrix with Legend */}
  <Card className="bg-gray-800/50 border-0">
    <CardHeader>
      <CardTitle>Plagiarized Confusion Matrix</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matrix Grid */}
        <div className="relative p-6">
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
            {/* True Positive */}
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-green-900/20 border border-green-600/30">
              <span className="text-3xl font-bold text-white">{results.confusionMatrixPlagiarized.truePositives}</span>
              <span className="text-xs text-green-400 font-medium mt-1">True Positive</span>
            </div>
            
            {/* False Negative */}
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-red-900/20 border border-red-600/30">
              <span className="text-3xl font-bold text-white">{results.confusionMatrixPlagiarized.falseNegatives}</span>
              <span className="text-xs text-red-400 font-medium mt-1">False Negative</span>
            </div>
            
            {/* False Positive */}
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-red-900/20 border border-red-600/30">
              <span className="text-3xl font-bold text-white">{results.confusionMatrixNonPlagiarized.falsePositives}</span>
              <span className="text-xs text-red-400 font-medium mt-1">False Positive</span>
            </div>
            
            {/* True Negative */}
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-green-900/20 border border-green-600/30">
              <span className="text-3xl font-bold text-white">{results.confusionMatrixNonPlagiarized.trueNegatives}</span>
              <span className="text-xs text-green-400 font-medium mt-1">True Negative</span>
            </div>
          </div>
        </div>
  
        {/* Totals */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            {/* First Row */}
            <div className="p-3 rounded-lg bg-gray-700/30 border border-gray-600/30 text-center">
              <span className="text-xs text-gray-400 block mb-1">Predicted Plagiarized</span>
              <span className="text-lg font-semibold text-white">
                {results.confusionMatrixPlagiarized.truePositives + results.confusionMatrixNonPlagiarized.falsePositives}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-gray-700/30 border border-gray-600/30 text-center">
              <span className="text-xs text-gray-400 block mb-1">Predicted Non-Plagiarized</span>
              <span className="text-lg font-semibold text-white">
                {results.confusionMatrixPlagiarized.falseNegatives + results.confusionMatrixNonPlagiarized.trueNegatives}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-600/30 row-span-2 flex flex-col items-center justify-center">
              <span className="text-xs text-blue-400">Total Analyzed Samples</span>
              <span className="text-lg font-semibold text-white mt-1">
                  {results.confusionMatrixPlagiarized.truePositives + 
                  results.confusionMatrixPlagiarized.falseNegatives + 
                  results.confusionMatrixNonPlagiarized.falsePositives + 
                  results.confusionMatrixNonPlagiarized.trueNegatives}
              </span>
            </div>
  
            {/* Second Row */}
            <div className="p-3 rounded-lg bg-gray-700/30 border border-gray-600/30 text-center">
              <span className="text-xs text-gray-400 block mb-1">Actual Plagiarized</span>
              <span className="text-lg font-semibold text-white">
                {results.confusionMatrixPlagiarized.truePositives + results.confusionMatrixPlagiarized.falseNegatives}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-gray-700/30 border border-gray-600/30 text-center">
              <span className="text-xs text-gray-400 block mb-1">Actual Non-Plagiarized</span>
              <span className="text-lg font-semibold text-white">
                {results.confusionMatrixNonPlagiarized.falsePositives + results.confusionMatrixNonPlagiarized.trueNegatives}
              </span>
            </div>
          </div>
        </div>
      </div>
  
      {/* Legend at the bottom */}
      <div className="mt-6 p-4 bg-gray-700/20 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-900/20 border border-green-600/30 rounded" />
              <span className="text-sm">Correct Classification</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-900/20 border border-red-600/30 rounded" />
              <span className="text-sm">Incorrect Classification</span>
            </div>
          </div>
          <div className="text-sm text-gray-400 space-y-1">
            <p><strong>True Positive:</strong> Correctly identified as plagiarized</p>
            <p><strong>True Negative:</strong> Correctly identified as non-plagiarized</p>
            <p><strong>False Positive:</strong> Incorrectly identified as plagiarized</p>
            <p><strong>False Negative:</strong> Incorrectly identified as non-plagiarized</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
          </>
        )}
      </div>
    </div>
  );
}

const MetricCard = ({ title, value, description }: { 
  title: string; 
  value: number; 
  description: string; 
}) => (
  <div className="p-4 rounded-lg bg-gray-700/50">
    <h3 className="text-sm font-medium text-gray-400">{title}</h3>
    <p className="text-2xl font-bold">{value.toFixed(1)}%</p>
    <p className="text-xs text-gray-500">{description}</p>
  </div>
);

const MatrixCell = ({ value, label, type }: { 
  value: number; 
  label: string; 
  type: 'positive' | 'negative'; 
}) => (
  <div className={`p-4 rounded-lg ${
    type === 'positive' ? 'bg-green-900/20' : 'bg-red-900/20'
  }`}>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm text-gray-400">{label}</p>
  </div>
);