import React from 'react';

const CodeBERTStats = ({ similarSnippets }) => {
  const validScores = similarSnippets
    .map(snippet => snippet.codebertScore)
    .filter(score => score !== null && score !== undefined);

  const averageScore = validScores.length > 0
    ? validScores.reduce((a, b) => a + b, 0) / validScores.length
    : null;

  const highestScore = validScores.length > 0
    ? Math.max(...validScores)
    : null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">CodeBERT Statistics</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-300 mb-1">Average Similarity</div>
          <div className="text-xl font-bold">
            {averageScore !== null ? `${averageScore.toFixed(1)}%` : 'N/A'}
          </div>
        </div>
        <div className="p-3 bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-300 mb-1">Highest Similarity</div>
          <div className="text-xl font-bold">
            {highestScore !== null ? `${highestScore.toFixed(1)}%` : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeBERTStats;