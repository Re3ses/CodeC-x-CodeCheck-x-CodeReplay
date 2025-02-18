import mongoose from 'mongoose';

interface LiveCodeRequest {
  request_reason: String;
  room_slug: String;
  problem_slug: String;
}

// TODO: make this shit requirerd
const LiveCodeRequestSchema = new mongoose.Schema<LiveCodeRequest>({
  request_reason: String,
  room_slug: String,
  problem_slug: String,
});

export default mongoose.models.LiveCodeRequest ||
  mongoose.model<LiveCodeRequest>('LiveCodeRequest', LiveCodeRequestSchema);
