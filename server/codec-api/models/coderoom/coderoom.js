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
    releaseDate: {
        type: Date,
        required: true,
        default: Date.now,
        get: date => new Date(date).toISOString()
    },
    dueDate: {
        type: Date,
        required: true,
        // Default to 7 days from now
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        get: date => new Date(date).toISOString()
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
}, { 
    toObject: { getters: true }, 
    toJSON: { getters: true },
    timestamps: true // Adds createdAt and updatedAt fields
})

// Add validation to ensure dueDate is after releaseDate
CoderoomSchema.pre('validate', function(next) {
    if (this.type && this.code) {
        this.slug = `${this.type.substring(0, 4).toLowerCase()}-${this.code}`
    }

    if (this.releaseDate && this.dueDate) {
        if (this.dueDate <= this.releaseDate) {
            next(new Error('Due date must be after release date'));
            return;
        }
    }

    next()
})

module.exports = mongoose.model('Coderoom', CoderoomSchema)