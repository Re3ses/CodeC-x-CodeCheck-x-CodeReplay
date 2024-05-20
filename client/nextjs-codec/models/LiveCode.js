import mongoose from "mongoose"

// TODO: make this shit requirerd
const LiveCodeRequestSchema = new mongoose.Schema({
    request_reason: String,
    room_slug: String,
    problem_slug: String
})

export default mongoose.models.LiveCodeRequest ||
    mongoose.model("LiveCodeRequest", LiveCodeRequestSchema)

