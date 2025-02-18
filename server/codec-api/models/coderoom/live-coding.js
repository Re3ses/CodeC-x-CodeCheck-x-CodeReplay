const mongoose = require('mongoose')

const { Schema } = mongoose

const LiveCodingSchema = Schema({
    test_case: {
        type: String,
        default: ""
    },
    live_session: {
        language_used: {
            type: String,
            default: ""
        },
        code: {
            type: String,
            default: ""
        },
        call_link: {
            type: String,
            default: ""
        },
        editor: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    learners: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
}, { toObject: { getters: true }, toJSON: { getters: true } })

module.exports = mongoose.model('LiveCoding', LiveCodingSchema)