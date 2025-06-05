'use client';
import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Target,
  BarChart2,
  ClipboardList,
  BarChart,
  Table,
  Fingerprint,  // for CodeCheck
  History,      // for CodeReplay
  Copyright
} from 'lucide-react';
import AgreementChart from './components/AgreementChart';
import ClassificationChart from './components/ClassificationChart';
import ToolCorrelationTable from './components/ToolCorrelationTable';
import SimilarityScoreChart from './components/SimilarityScoreChart';
import TestCasesTable from './components/TestCasesTable';

export default function StudyResults() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col mb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-4 flex-1 mr-8">
              {/* Separated icon and title into a new container with better alignment */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <BookOpen className="mt-3 w-12 h-12 text-yellow-500" /> {/* Fixed size using w/h instead of text-size */}
                </div>
                <h1 className="text-3xl font-bold">
                  Assessing Code Similarity Detection Utilizing 
                  <span className="text-yellow-500"> CodeBERT </span> 
                  for an Online Competitive Programming Platform
                </h1>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Copyright className="h-3 w-3" />
                <p className="leading-relaxed">
                  Mark Joseph <span className="text-yellow-500">Espiritu</span> | 
                  Gabriel <span className="text-yellow-500">Reuyan</span> | 
                  Advisor: Joshua C. Martinez | 
                  Ateneo de Naga University, Department of Computer Science
                </p>
              </div>
            </div>
            <Link 
              href="/login" 
              className="flex-shrink-0 px-6 py-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-lg transition-colors"
            >
              Back to Login
            </Link>
          </div>

          {/* Real-world Data Button */}
          <div className="flex justify-center mt-8">
            <Link
              href="/study-results/real-world-data"
              className="w-full p-4 bg-gray-800/80 rounded-xl text-center 
                         hover:bg-gray-700/80 transition-colors
                         flex flex-col items-center"
            >
              <h3 className="text-lg font-semibold text-yellow-500">
                View Real-World Data Collection
              </h3>
              <p className="text-sm text-white/60">
                Explore our latest findings from ongoing plagiarism detection analysis
              </p>
            </Link>
          </div>
        </div>

        {/* Model Evaluation with Test Cases */}
        <section className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl">
          <div className="flex items-center mb-4">
            <Target className="text-2xl text-yellow-500 mr-2" />
            <h2 className="text-xl font-semibold text-yellow-500">Initial Model Evaluation</h2>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <p className="text-white/80 text-sm leading-relaxed">
                Our research began with training a <span className="text-yellow-500">CodeBERT model</span> for 
                plagiarism detection, following a comprehensive pipeline from data collection to model evaluation. 
                The process involved careful preprocessing of the IR-Plag dataset, including code tokenization, 
                tree-sitter parsing, and data organization.
              </p>
              <p className="text-white/80 text-sm leading-relaxed mt-4">
                While initial validation showed promising accuracy, detailed test case analysis revealed 
                critical limitations in the model's practical application:
              </p>
            </div>

            {/* Test Cases Table */}
            <TestCasesTable />

          </div>
        </section>

        {/* Tools Description */}
        <section className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl my-4">
          <div className="flex items-center mb-6">
            <Target className="text-2xl text-yellow-500 mr-2" />
            <h2 className="text-xl font-semibold text-yellow-500">Our Solution</h2>
          </div>
          <p className="text-white/80 text-sm leading-relaxed mb-6">
            The test cases demonstrated that while the model could identify obvious similarities, it 
            struggled with nuanced code modifications. This led to the development of two specialized tools:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700/50 p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Fingerprint className="text-2xl text-yellow-500" />
                <h3 className="text-lg font-semibold text-yellow-500">CodeCheck</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                A fingerprinting-based similarity detection tool that leverages CodeBERT's embeddings. 
                It extracts semantic representations of code snippets and computes their similarity 
                using cosine similarity, providing a more nuanced measure of code similarity that can 
                detect subtle modifications and variations in implementation.
              </p>
            </div>
            <div className="bg-gray-700/50 p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <History className="text-2xl text-yellow-500" />
                <h3 className="text-lg font-semibold text-yellow-500">CodeReplay</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                An innovative behavioral analysis tool that monitors code evolution patterns. 
                It automatically captures and analyzes code snapshots during development, 
                comparing sequential versions using embedding similarity. Sudden drops in 
                similarity scores may indicate unauthorized code insertion or unnatural 
                programming patterns.
              </p>
            </div>
          </div>
        </section>

        {/* Key Findings section */}
        <section className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl">
          <div className="flex items-center mb-6">
            <BarChart2 className="text-2xl text-yellow-500 mr-2" />
            <h2 className="text-xl font-semibold text-yellow-500">Key Findings</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Agreement Rates */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tool Agreement Rates</h3>
              <AgreementChart />
              <p className="text-sm text-white/80">
                Quantitative analysis revealed significant variations in tool agreement rates. 
                MOSS and Dolos showed the highest concordance at <span className="text-yellow-500">81.6%</span>, 
                while CodeCheck demonstrated lower agreement rates: <span className="text-yellow-500">21.6%</span> with 
                MOSS and <span className="text-yellow-500">40.0%</span> with Dolos. This disparity suggests distinct 
                detection mechanisms and highlights the complementary nature of these tools.
              </p>
            </div>

            {/* Classification Analysis */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Comparative Class Analysis</h3>
              <ClassificationChart />
              <p className="text-sm text-white/80">
                Distribution analysis shows distinct classification patterns across tools. CodeCheck exhibited a 
                predominant medium-similarity classification (<span className="text-yellow-500">90.5%</span>), while 
                MOSS favored low-similarity categorization (<span className="text-yellow-500">84.0%</span>). Dolos 
                demonstrated more balanced distribution: <span className="text-yellow-500">64.5%</span> low and 
                <span className="text-yellow-500">24.9%</span> medium similarity, indicating varying sensitivity 
                levels in detection algorithms.
              </p>
            </div>

            {/* Tool Correlation */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tool Correlation Matrix</h3>
              <ToolCorrelationTable />
              <p className="text-sm text-white/80">
                Correlation analysis indicates minimal linear relationship between CodeCheck and traditional tools 
                (correlation coefficients: <span className="text-yellow-500">-0.01 to -0.05</span>). MOSS and Dolos 
                exhibited moderate positive correlation (<span className="text-yellow-500">0.60</span>), suggesting 
                similar underlying detection principles but distinct from CodeCheck's approach.
              </p>
            </div>

            {/* Average Similarity Scores */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Average Similarity Scores</h3>
              <SimilarityScoreChart />
              <p className="text-sm text-white/80">
                Mean similarity score analysis revealed systematic differences in detection thresholds. CodeCheck 
                demonstrated higher sensitivity (<span className="text-yellow-500">70.2%</span> average), while MOSS 
                implemented more conservative thresholds. CodeReplay's behavioral analysis produced moderate scores 
                (<span className="text-yellow-500">49.4%</span>), reflecting its unique temporal evaluation approach.
              </p>
            </div>
          </div>
        </section>

        {/* Conclusion section */}
        <section className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl mt-8">
          <div className="flex items-center mb-4">
            <BarChart className="text-2xl text-yellow-500 mr-2" />
            <h2 className="text-xl font-semibold text-yellow-500">Conclusion</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-white/80 leading-relaxed">
              Our study assessed <span className="text-yellow-500">CodeBERT</span> for effective code plagiarism detection. 
              Initial CodeBERT classification, while accurate, showed bias, necessitating more nuanced tools. 
              <span className="text-yellow-500"> CodeCheck</span>, utilizing CodeBERT embeddings with an amplification method, 
              provided more realistic similarity scores, distinguishing subtle code modifications.
            </p>
            <p className="text-sm text-white/80 leading-relaxed">
              <span className="text-yellow-500">CodeReplay</span> offered complementary behavioral analysis of code evolution. 
              A comparative analysis across <span className="text-yellow-500">97 C++ submissions</span> revealed that 
              CodeCheck and CodeReplay provided distinct insights compared to traditional tools.
            </p>
            <p className="text-sm text-white/80 leading-relaxed">
              This highlights that <span className="text-yellow-500">no single tool is exhaustive</span>; 
              a comprehensive approach integrating CodeBERT's semantic understanding with other methodologies 
              is crucial for robust plagiarism detection. Further studies are needed, and ultimately, 
              <span className="text-yellow-500"> combining CodeCheck and CodeReplay</span> would offer a more 
              robust and complete solution for maintaining academic integrity in competitive programming.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

