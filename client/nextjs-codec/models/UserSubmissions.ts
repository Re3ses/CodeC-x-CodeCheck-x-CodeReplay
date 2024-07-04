import mongoose from 'mongoose';

export interface UserSubmissions extends mongoose.Document {
  language_used: string;
  code: string;
  score: number;
  score_overall_count: number;
  verdict: string;
  learner: mongoose.ObjectId;
  problem: string;
  room: string;
  submission_date: Date;
}

const UserSubmissionsSchema = new mongoose.Schema<UserSubmissions>({
  language_used: {
    type: String,
    required: [true, 'Enter language used'],
  },
  code: {
    type: String,
    required: [true, 'Enter programming language used'],
  },
  score: {
    type: Number,
    required: [true, 'Enter submission score'],
  },
  score_overall_count: {
    type: Number,
    required: [true, 'Enter overall score total count'],
  },
  verdict: {
    type: String,
    required: [true, 'Enter verdict'],
    enum: ['ACCEPTED', 'REJECTED'],
    default: 'REJECTED',
  },
  learner: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Enter learner username'],
  },
  problem: {
    type: String,
    required: [true, 'Enter problem slug'],
  },
  room: {
    type: String,
    required: [true, 'Enter room slug'],
  },
  submission_date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.UserSubmission ||
  mongoose.model<UserSubmissions>('UserSubmission', UserSubmissionsSchema);
