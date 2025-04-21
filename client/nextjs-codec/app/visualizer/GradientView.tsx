import { GradientAnalysis } from './types';
interface GradientViewProps {
    gradientAnalysis: GradientAnalysis | null;
}

export default function GradientView({ gradientAnalysis }: GradientViewProps) {
    if (!gradientAnalysis) {
        return (
            <div className="text-center py-8 text-gray-500">
                No embedding analysis available
            </div>
        );
    }

    const renderGradientAnalysis = () => (
        <div className="space-y-6">
            {gradientAnalysis && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                        Embedding Analysis
                    </h3>
    
                    {/* Visualization Section */}
                    {gradientAnalysis.visualization && (
                        <div className="flex justify-center mb-6">
                            <img 
                                src={gradientAnalysis.visualization} 
                                alt="Embedding Gradient Analysis"
                                className="max-w-[600px] h-auto"
                            />
                        </div>
                    )}
    
                    {/* Token Analysis Section - More Compact Layout */}
                    {gradientAnalysis.dimension_analysis?.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Dimension Analysis
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {gradientAnalysis.dimension_analysis.map((dim, idx) => (
                                    <div 
                                        key={idx}
                                        className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-sm"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                Dimension {dim.dimension}
                                            </span>
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">
                                                {dim.score.toFixed(4)}
                                            </span>
                                        </div>
    
                                        <div className="space-y-2">
                                            {dim.tokens.map((token, tokenIdx) => (
                                                <div key={tokenIdx} className="border-l-2 border-gray-300 pl-2">
                                                    <div className="flex items-baseline gap-2 flex-wrap">
                                                        <div className="flex-1 flex items-center justify-between">
                                                            <code className="text-xs px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded">
                                                                {token}
                                                            </code>
                                                            <span className="text-xs font-mono bg-blue-50 dark:bg-blue-900/50 px-2 py-0.5 rounded ml-2">
                                                                Activation: {dim.activation_scores[tokenIdx]?.toFixed(3)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {dim.contexts[tokenIdx] && (
                                                        <div className="text-xs text-gray-500 mt-1 pl-2 border-l border-gray-200">
                                                            Context: {dim.contexts[tokenIdx]}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return renderGradientAnalysis();
}