import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Code2, ChevronRight, Shield } from 'lucide-react';

const problemSets = [
	{
		id: "box-formatter-4312784064",
		name: 'Box Formatter',
		averageSimilarity: 68.5,
	},
	{
		id: "character-inspector-4333782441",
		name: 'Character Inspector',
		averageSimilarity: 72.3,
	},
	{
		id: "fahrenheit-to-celsius-converter-8133077604",
		name: 'Fahrenheit To Celsius',
		averageSimilarity: 65.7,
	},
	{
		id: "perfectly-rooted-5136456806",
		name: 'Perfectly Rooted',
		averageSimilarity: 70.1,
	},
	{
		id: "count-vowels-in-a-string-7746433050",
		name: 'Count Vowels In A String',
		averageSimilarity: 75.4,
	},
	{
		id: "linear-search-for-odd-numbers-4386603267",
		name: 'Linear Search For Odd Numbers',
		averageSimilarity: 69.8,
	},
	{
		id: "palindrome-check-6834925212",
		name: 'Palindrome Check',
		averageSimilarity: 71.2,
	},
];

export default function RealWorldData() {
	return (
		<div className="min-h-screen bg-gray-900 text-white p-8">
			<div className="max-w-6xl mx-auto">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-2xl font-bold text-yellow-500">
						Real-World Data Collection
					</h1>
					<Link
						href="/study-results"
						className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-lg transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Study
					</Link>
				</div>

				{/* New Introduction Section */}
				<div className="bg-gray-800/50 p-6 rounded-xl mb-8 border border-gray-700/30">
					<div className="flex items-start gap-3 mb-4">
						<Shield className="text-yellow-500 mt-1" />
						<div>
							<h2 className="text-lg font-semibold mb-2">
								About This Dataset
							</h2>
							<p className="text-sm text-white/80 leading-relaxed">
								These problem sets represent a subset of submissions from our
								real-world evaluation, drawn from a larger collection of{' '}
								<span className="text-yellow-500">97 programming challenges</span>{' '}
								across two competitive programming classes. All data has been
								anonymized to protect student privacy while maintaining the
								integrity of our analysis.
							</p>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{problemSets.map((problem) => (
						<Link
							href={`/study-results/codeHistory/problem/${problem.id}`}
							key={problem.id}
							className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/30 
                         hover:bg-gray-700/50 transition-all hover:border-gray-600/50 
                         group cursor-pointer"
						>
							<div className="flex items-start justify-between mb-3">
								<div className="flex items-center gap-3">
									<Code2 className="text-yellow-500" />
									<h3 className="text-lg font-semibold">{problem.name}</h3>
								</div>
								<ChevronRight className="text-gray-500 group-hover:text-yellow-500 transition-colors" />
							</div>
							<div className="mt-4 flex items-center justify-between text-sm">
								<span className="text-white/60">
									Avg. Similarity:{' '}
									<span className="text-yellow-500">
										{problem.averageSimilarity}%
									</span>
								</span>
							</div>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}