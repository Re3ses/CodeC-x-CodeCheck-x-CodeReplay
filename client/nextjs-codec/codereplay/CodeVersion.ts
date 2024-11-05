// models/CodeVersion.ts
import mongoose from 'mongoose';

const codeVersionSchema = new mongoose.Schema({
  learner_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  learner: {
    type: String,
    required: true
  },
  submissionId: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  similarityResults: [{
    comparedWithVersionId: String,
    score: Number,
    timestamp: Date
  }],
  problem: {
    type: String,
    required: true
  },
  room: {
    type: String,
    required: true
  }
});

export const CodeVersion = mongoose.models.CodeVersion || mongoose.model('CodeVersion', codeVersionSchema);