const mongoose = require('mongoose')

const { Schema } = mongoose

const HeartSchema = require('./heart').schema

const SubmissionSchema = Schema({
    language: {
        type: String
    },
    code: {
        type: String
    },
    date_time: {
        type: Date,
        default: Date.now,
        get: dt => new Date(dt).toLocaleString()
    },
    score: {
        type: Number,
        default: 0
    },
    verdict: {
        type: String,
        enum: ["Judging", "Wrong Answer", "Partially Accepted", "Accepted"],
        default: "Judging"
    },
    time_complexity: {
        type: Number,
        default: -1
    },
    space_complexity: {
        type: Number,
        default: -1
    },
    heart: {
        type: HeartSchema
    },
    learner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    problem: {
        type: Schema.Types.ObjectId,
        ref: 'Problem'
    },
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Coderoom'
    }
}, { toObject: { getters: true }, toJSON: { getters: true } })

module.exports = mongoose.model('Submission', SubmissionSchema)