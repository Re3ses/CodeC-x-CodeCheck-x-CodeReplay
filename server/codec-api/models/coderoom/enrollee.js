const mongoose = require('mongoose')

const { Schema } = mongoose

const BadgeSchema = require('../user/badge').schema

const EnrolleeSchema = Schema({
    learner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    group_progress: {
        type: Schema.Types.ObjectId,
        ref: 'GroupProgress'
    },
    points: {
        type: Number
    },
    multiplier: {
        type: Schema.Types.Decimal128,
        get: m => m.toString()
    },
    streak: {
        current: {
            type: Number
        },
        highest: {
            type: Number
        }
    },
    date_enrolled: {
        type: Date,
        default: Date.now,
        get: date => new Date(date).toLocaleDateString()
    },
    badges: {
        type: [BadgeSchema]
    },
    featured_badge: {
        type: BadgeSchema
    }
}, { toObject: { getters: true }, toJSON: { getters: true } })

module.exports = EnrolleeSchema