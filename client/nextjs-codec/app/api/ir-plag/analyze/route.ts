import { NextRequest } from 'next/server';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// Update dataset path to correct location
const DATASET_PATH = join(process.cwd(), 'app', 'ir-plag', 'IR-Plag-Dataset');
console.log('Dataset path:', DATASET_PATH); // Debug log

// Verify dataset exists
try {
  const exists = readdirSync(DATASET_PATH);
  console.log('Dataset found with cases:', exists);
} catch (error) {
  console.error('Error accessing dataset:', error);
}

const SIMILARITY_THRESHOLD = 0.50;

interface FileComparison {
  originalPath: string;
  comparePath: string;
  isPlagiarized: boolean;
  similarity: number;
}

// Add this helper function at the top of the file
function getOriginalFileName(caseNumber: string): string {
  // Extract case number (e.g., "case-01" -> "1")
  const num = parseInt(caseNumber.split('-')[1]);
  return `T${num}.java`;
}

// Add helper function to count Java files recursively
function countJavaFiles(dirPath: string): number {
  let count = 0;
  const items = readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = join(dirPath, item);
    const stats = statSync(fullPath);
    
    if (stats.isDirectory()) {
      count += countJavaFiles(fullPath);
    } else if (item.endsWith('.java')) {
      count++;
    }
  }
  
  return count;
}

// Add helper function to get all Java files recursively
function getAllJavaFiles(dirPath: string): string[] {
  let files: string[] = [];
  const items = readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = join(dirPath, item);
    const stats = statSync(fullPath);
    
    if (stats.isDirectory()) {
      files = files.concat(getAllJavaFiles(fullPath));
    } else if (item.endsWith('.java')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function* processDataset() {
  let totalFiles = 0;
  let processedFiles = 0;
  const confusionMatrixPlagiarized = {
    truePositives: 0,
    falseNegatives: 0
  };
  const confusionMatrixNonPlagiarized = {
    trueNegatives: 0,
    falsePositives: 0
  };

  try {
    console.log('Starting dataset processing at:', DATASET_PATH);
    
    // Get cases 01-07
    const cases = Array.from({ length: 7 }, (_, i) => `case-${String(i + 1).padStart(2, '0')}`);
    console.log('Processing cases:', cases);

    // First count total files to analyze
    for (const caseDir of cases) {
      const casePath = join(DATASET_PATH, caseDir);
      
      try {
        // Count actual Java files in each category
        const plagPath = join(casePath, 'plagiarized');
        const nonPlagPath = join(casePath, 'non-plagiarized');
        
        const plagiarizedCount = countJavaFiles(plagPath);
        const nonPlagiarizedCount = countJavaFiles(nonPlagPath);
        totalFiles += plagiarizedCount + nonPlagiarizedCount;
        
        console.log(`Case ${caseDir}:`, {
          plagiarized: plagiarizedCount,
          nonPlagiarized: nonPlagiarizedCount
        });
      } catch (error) {
        console.error(`Error counting files in ${caseDir}:`, error);
      }
    }

    console.log(`Total files to analyze: ${totalFiles}`);

    // Process each case
    for (const caseDir of cases) {
      const casePath = join(DATASET_PATH, caseDir);
      console.log(`\nProcessing case: ${caseDir}`);

      try {
        // Get the correct original file name for this case
        const originalFileName = getOriginalFileName(caseDir);
        const originalPath = join(casePath, 'original', originalFileName);
        
        console.log(`Reading original file: ${originalPath}`);
        
        try {
          const originalCode = readFileSync(originalPath, 'utf-8');
          console.log(`Successfully read original file ${originalFileName}`);

          // Process all plagiarized Java files
          const plagPath = join(casePath, 'plagiarized');
          const plagiarizedFiles = getAllJavaFiles(plagPath);
          
          for (const filePath of plagiarizedFiles) {
            console.log(`Analyzing plagiarized submission: ${filePath}`);
            
            try {
              const plagCode = readFileSync(filePath, 'utf-8');
              const similarity = await calculateSimilarity(originalCode, plagCode);
              
              const detected = similarity >= SIMILARITY_THRESHOLD;
              if (detected) confusionMatrixPlagiarized.truePositives++;
              else confusionMatrixPlagiarized.falseNegatives++;

              console.log(`Plagiarized comparison result:`, {
                file: filePath,
                similarity: similarity.toFixed(2),
                detected,
                verdict: detected ? 'Correctly Detected' : 'Missed Detection'
              });

              processedFiles++;
              yield JSON.stringify({
                progress: (processedFiles / totalFiles) * 100,
                currentFile: filePath,
                type: 'plagiarized',
                caseId: caseDir,
                similarity: similarity.toFixed(2)
              }) + '\n';
            } catch (error) {
              console.error(`Error processing plagiarized file ${filePath}:`, error);
            }
          }

          // Process all non-plagiarized Java files
          const nonPlagPath = join(casePath, 'non-plagiarized');
          const nonPlagiarizedFiles = getAllJavaFiles(nonPlagPath);
          
          for (const filePath of nonPlagiarizedFiles) {
            console.log(`Analyzing non-plagiarized submission: ${filePath}`);
            
            try {
              const nonPlagCode = readFileSync(filePath, 'utf-8');
              const similarity = await calculateSimilarity(originalCode, nonPlagCode);
              
              const detected = similarity >= SIMILARITY_THRESHOLD;
              if (!detected) confusionMatrixNonPlagiarized.trueNegatives++;
              else confusionMatrixNonPlagiarized.falsePositives++;

              console.log(`Non-plagiarized comparison result:`, {
                file: filePath,
                similarity: similarity.toFixed(2),
                detected,
                verdict: !detected ? 'Correctly Identified' : 'False Alarm'
              });

              processedFiles++;
              yield JSON.stringify({
                progress: (processedFiles / totalFiles) * 100,
                currentFile: filePath,
                type: 'non-plagiarized',
                caseId: caseDir,
                similarity: similarity.toFixed(2)
              }) + '\n';
            } catch (error) {
              console.error(`Error processing non-plagiarized file ${filePath}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error reading original file ${originalFileName} in ${caseDir}:`, error);
          continue;
        }
      } catch (error) {
        console.error(`Error processing case ${caseDir}:`, error);
      }
    }

    // Calculate and log final metrics
    const { truePositives, falseNegatives } = confusionMatrixPlagiarized;
    const { trueNegatives, falsePositives } = confusionMatrixNonPlagiarized;
    const totalPlagiarized = truePositives + falseNegatives;
    const totalNonPlagiarized = trueNegatives + falsePositives;
    
    // Guard against division by zero
    const accuracyPlagiarized = totalPlagiarized > 0 ? truePositives / totalPlagiarized : 0;
    const precisionPlagiarized = (truePositives + falsePositives) > 0 ? truePositives / (truePositives + falsePositives) : 0;
    const recallPlagiarized = (truePositives + falseNegatives) > 0 ? truePositives / (truePositives + falseNegatives) : 0;
    const f1ScorePlagiarized = (precisionPlagiarized + recallPlagiarized) > 0 ? 2 * (precisionPlagiarized * recallPlagiarized) / (precisionPlagiarized + recallPlagiarized) : 0;

    const accuracyNonPlagiarized = totalNonPlagiarized > 0 ? trueNegatives / totalNonPlagiarized : 0;
    const precisionNonPlagiarized = (trueNegatives + falseNegatives) > 0 ? trueNegatives / (trueNegatives + falseNegatives) : 0;
    const recallNonPlagiarized = (trueNegatives + falsePositives) > 0 ? trueNegatives / (trueNegatives + falsePositives) : 0;
    const f1ScoreNonPlagiarized = (precisionNonPlagiarized + recallNonPlagiarized) > 0 ? 2 * (precisionNonPlagiarized * recallNonPlagiarized) / (precisionNonPlagiarized + recallNonPlagiarized) : 0;

    console.log('\nAnalysis Complete:', {
      totalFiles,
      processedFiles,
      accuracyPlagiarized: accuracyPlagiarized.toFixed(2),
      precisionPlagiarized: precisionPlagiarized.toFixed(2),
      recallPlagiarized: recallPlagiarized.toFixed(2),
      f1ScorePlagiarized: f1ScorePlagiarized.toFixed(2),
      accuracyNonPlagiarized: accuracyNonPlagiarized.toFixed(2),
      precisionNonPlagiarized: precisionNonPlagiarized.toFixed(2),
      recallNonPlagiarized: recallNonPlagiarized.toFixed(2),
      f1ScoreNonPlagiarized: f1ScoreNonPlagiarized.toFixed(2),
      confusionMatrixPlagiarized,
      confusionMatrixNonPlagiarized
    });

    yield JSON.stringify({
      progress: 100,
      results: {
        accuracyPlagiarized,
        precisionPlagiarized,
        recallPlagiarized,
        f1ScorePlagiarized,
        accuracyNonPlagiarized,
        precisionNonPlagiarized,
        recallNonPlagiarized,
        f1ScoreNonPlagiarized,
        confusionMatrixPlagiarized,
        confusionMatrixNonPlagiarized,
        totalComparisons: processedFiles,
        processedFiles: totalFiles
      }
    }) + '\n';

  } catch (error) {
    console.error('Fatal error during analysis:', error);
    throw error;
  }
}

// Update the similarity calculation function to handle errors better
async function calculateSimilarity(code1: string, code2: string): Promise<number> {
  try {
    const response = await fetch('http://localhost:5000/api/similarity/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code1, code2 })
    });

    if (!response.ok) {
      console.error('Similarity calculation failed:', await response.text());
      return 0;
    }

    const data = await response.json();
    if (!data.success || typeof data.similarity !== 'number') {
      console.error('Invalid similarity response:', data);
      return 0;
    }

    return data.similarity;
  } catch (error) {
    console.error('Error calculating similarity:', error);
    return 0;
  }
}

export async function POST(req: NextRequest) {
  // Create a ReadableStream directly
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of processDataset()) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        // Send completion message
        controller.enqueue(new TextEncoder().encode(JSON.stringify({ completed: true }) + '\n'));
        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
        controller.enqueue(new TextEncoder().encode(JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          completed: true 
        }) + '\n'));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
