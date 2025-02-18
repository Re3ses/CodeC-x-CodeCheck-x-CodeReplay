const mongoose = require('mongoose')

const { Schema } = mongoose

const BadgeSchema = Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    condition: {
        type: Number,
        required: true
    },
    is_viewed: {
        type: Number,
        default: false
    }
}, { toObject: { getters: true }, toJSON: { getters: true } })

module.exports = mongoose.model('Badge', BadgeSchema)