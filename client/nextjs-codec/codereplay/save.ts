// pages/api/code-versions/save.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from './db';
import { CodeVersion } from './CodeVersion';
import { calculateCodeSimilarity } from './Similarity';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const {
      learner_id,
      learner,
      submissionId,
      code,
      language,
      problem,
      room
    } = req.body;

    // Save new version
    const newVersion = await CodeVersion.create({
      learner_id,
      learner,
      submissionId,
      code,
      language,
      problem,
      room,
      timestamp: new Date(),
      similarityResults: []
    });

    // Find other versions from the same problem and room
    const otherVersions = await CodeVersion.find({
      problem,
      room,
      learner_id: { $ne: learner_id },
      timestamp: { 
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    });

    // Calculate similarity with other versions
    const similarityResults = await Promise.all(
      otherVersions.map(async (version) => {
        const score = calculateCodeSimilarity(code, version.code);
        
        // If similarity is significant (> 0.7), save it
        if (score > 0.7) {
          const similarityResult = {
            comparedWithVersionId: version._id.toString(),
            score,
            timestamp: new Date()
          };

          // Update the new version with similarity result
          await CodeVersion.findByIdAndUpdate(
            newVersion._id,
            { $push: { similarityResults: similarityResult } }
          );

          return similarityResult;
        }
        return null;
      })
    );

    // Filter out null results and sort by score
    const significantSimilarities = similarityResults
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score);

    return res.status(200).json({
      version: newVersion,
      similarityResults: significantSimilarities
    });
  } catch (error) {
    console.error('Error saving code version:', error);
    return res.status(500).json({ error: 'Error saving code version' });
  }
}