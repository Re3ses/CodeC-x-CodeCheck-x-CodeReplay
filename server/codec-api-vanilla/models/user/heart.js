const mongoose = require('mongoose')

const { Schema } = mongoose

const HeartSchema = Schema({
    lives: {
        type: Number,
        min: [0, 'No lives left to deplete']
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

module.exports = mongoose.model('Heart', HeartSchema)