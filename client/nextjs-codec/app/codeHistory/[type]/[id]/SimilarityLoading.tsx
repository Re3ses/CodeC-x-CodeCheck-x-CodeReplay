import React from 'react';

const SimilarityLoading = () => {
  return (
    <div className="p-6 border border-gray-700 rounded-lg bg-gray-800/50">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <div className="flex flex-col items-center space-y-2">
          <div className="text-sm text-gray-400">Analyzing Code Similarity</div>
          <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-blue-500 rounded-full animate-pulse" />
          </div>
          <div className="text-xs text-gray-500">
            Checking patterns and semantic meaning...
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimilarityLoading;