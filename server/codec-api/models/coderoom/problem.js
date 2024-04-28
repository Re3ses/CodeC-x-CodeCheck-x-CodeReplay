const mongoose = require('mongoose')
const slugify = require('slugify')
const nanoid = require('nanoid').customAlphabet('0123456789', 10)

const { Schema } = mongoose

const ProblemSchema = Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    code: {
        type: String,
        unique: true,
        sparse: true,
        default: () => nanoid()
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        sparse: true
    },
    input_format: {
        type: String,
    },
    output_format: {
        type: String,
    },
    constraints: {
        type: String
    },
    release: {
        type: Date,
        default: Date.now,
        get: dt => new Date(dt).toLocaleString()
    },
    deadline: {
        type: Date,
        get: dt => new Date(dt).toLocaleString()
    },
    difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"]
    },
    languages: [
        {
            name: {
                type: String,
                required: true
            },
            code_snippet: {
                type: String
            },
            time_complexity: {
                type: Number,
                required: true
            },
            space_complexity: {
                type: Number,
                required: true
            }
        }
    ],
    test_cases: [
        {
            input: {
                type: String,
                default: ""
            },
            output: {
                type: String,
                default: ""
            },
            is_sample: {
                type: Boolean,
                default: false
            },
            is_eval: {
                type: Boolean,
                default: false
            },
            strength: {
                type: Number,
                default: 0,
                min: [0, 'Negative strength is invalid']
            }
        }
    ],
    is_archived: {
        type: Boolean,
        default: false
    },
    mentor: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { toObject: { getters: true }, toJSON: { getters: true } })

ProblemSchema.pre('validate', function(next) {
    if (this.name && this.code)
        this.slug = `${slugify(this.name, { lower: true, strict: true })}-${this.code}`
        
    next()
})

module.exports = mongoose.model('Problem', ProblemSchema)