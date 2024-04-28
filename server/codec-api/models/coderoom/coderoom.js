const mongoose = require('mongoose')
const { nanoid } = require('nanoid')

const { Schema } = mongoose

const EnrolleeSchema = require('./enrollee')

const CoderoomSchema = Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    type: {
        type: String,
        enum: ['Competitive', 'Cooperative'],
        required: true
    },
    code: {
        type: String,
        unique: true,
        sparse: true,
        default: () => nanoid(10)
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        sparse: true
    },
    date_created: {
        type: Date,
        default: Date.now,
        get: date => new Date(date).toLocaleDateString()
    },
    enrollees: {
        type: [EnrolleeSchema]
    },
    problems: {
        type: [Schema.Types.ObjectId],
        ref: 'Problem'
    },
    is_locked: {
        type: Boolean,
        default: false
    },
    is_archived: {
        type: Boolean,
        default: false
    },
    mentor: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { toObject: { getters: true }, toJSON: { getters: true } })

CoderoomSchema.pre('validate', function(next) {
    if (this.type && this.code)
        this.slug = `${this.type.substring(0, 4).toLowerCase()}-${this.code}`

    next()
})

module.exports = mongoose.model('Coderoom', CoderoomSchema)