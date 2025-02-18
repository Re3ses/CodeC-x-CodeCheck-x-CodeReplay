const mongoose = require('mongoose')

const { Schema } = mongoose

const GroupProgressSchema = Schema({
    requirements: [
        {
            type: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            },
            milestones: {
                type: [Number],
                required: true
            },
            contributions: {
                type: Number,
                default: 0
            },
            filenames: {
                type: [String],
                required: true
            }
        }
    ],
    available_slot: {
        type: Number,
        default: 3,
        min: [0, 'No available slots left'],
        max: [3, 'Exceeded maximum slots']
    },
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Coderoom'
    },
    liveroom: {
        type: Schema.Types.ObjectId,
        ref: 'LiveCoding'
    }
}, { toObject: { getters: true }, toJSON: { getters: true } })

module.exports = mongoose.model('GroupProgress', GroupProgressSchema)