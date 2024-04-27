const mongoose = require('mongoose')

const { Schema } = mongoose

const SaveSchema = Schema({
    language: {
        type: String
    },
    code: {
        type: String
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

module.exports = mongoose.model('Save', SaveSchema)