import mongoose, { Schema, Document } from 'mongoose';

export interface ICodeSnapshot extends Document {
  code: string;
  timestamp: string;
  learner_id: string;
  problemId: string;
  roomId: string;
  submissionId: string;
  version: number;
}

const CodeSnapshotSchema: Schema = new Schema({
  code: { type: String, required: true },
  timestamp: { type: String, required: true },
  learner_id: { type: String, required: true },
  problemId: { type: String, required: true },
  roomId: { type: String, required: true },
  submissionId: { type: String, required: true },
  version: { type: Number, required: true, index: true }  // Added index
});

// Add a compound index for querying
CodeSnapshotSchema.index({ learner_id: 1, problemId: 1, roomId: 1, version: 1 });

export default mongoose.models.CodeSnapshot || mongoose.model<ICodeSnapshot>('CodeSnapshot', CodeSnapshotSchema);