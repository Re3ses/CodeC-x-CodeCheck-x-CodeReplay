const mongoose = require('mongoose')

const { Schema } = mongoose

const AttemptTrackerSchema = Schema({
    date_time: {
        type: Date,
        default: Date.now,
        get: dt => new Date(dt).toLocaleString()
    },
    attempt_time: {
        type: Number,
        default: 0
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

module.exports = mongoose.model('AttemptTracker', AttemptTrackerSchema)