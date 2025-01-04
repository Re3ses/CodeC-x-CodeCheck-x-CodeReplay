import mongoose from 'mongoose';

export interface UserSubmissions extends mongoose.Document {
  language_used: string;
  code: string;
  score: number;
  score_overall_count: number;
  verdict: string;
  learner: string;
  learner_id: mongoose.ObjectId;
  problem: string;
  room: string;
  submission_date: Date;
  attempt_count: number;
  completion_time: number;
  start_time: number;
  end_time: number;
  most_similar: string;
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
    type: String,
    required: [true, 'Enter learner username'],
  },
  learner_id: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Enter learner user id'],
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
  attempt_count: {
    type: Number,
    default: 0,
  },
  start_time: {
    type: Number,
    default: 0,
  },
  end_time: {
    type: Number,
    default: 0,
  },
  completion_time: {
    type: Number, // in ms
    default: 0,
  },
  most_similar: {
    type: String,
    default: '',
  },
});

export default mongoose.models.UserSubmission ||
  mongoose.model<UserSubmissions>('UserSubmission', UserSubmissionsSchema);
