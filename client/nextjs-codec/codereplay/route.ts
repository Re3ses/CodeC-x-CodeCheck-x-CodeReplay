import { NextResponse } from 'next/server';
import { connectDB } from './db';
import { CodeVersion } from './CodeVersion';
import { calculateCodeSimilarity } from './Similarity';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectDB();

    const newVersion = await CodeVersion.create({
      ...body,
      timestamp: new Date(),
      similarityResults: []
    });

    const otherVersions = await CodeVersion.find({
      problem: body.problem,
      room: body.room,
      learner_id: { $ne: body.learner_id },
      timestamp: { 
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    });

    const similarityResults = await Promise.all(
      otherVersions.map(async (version) => {
        const score = calculateCodeSimilarity(body.code, version.code);
        if (score > 0.7) {
          const similarityResult = {
            comparedWithVersionId: version._id.toString(),
            score,
            timestamp: new Date()
          };

          await CodeVersion.findByIdAndUpdate(
            newVersion._id,
            { $push: { similarityResults: similarityResult } }
          );

          return similarityResult;
        }
        return null;
      })
    );

    const significantSimilarities = similarityResults
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score);

    return NextResponse.json({
      version: newVersion,
      similarityResults: significantSimilarities
    });
  } catch (error) {
    console.error('Error saving code version:', error);
    return NextResponse.json(
      { error: 'Error saving code version' },
      { status: 500 }
    );
  }
}