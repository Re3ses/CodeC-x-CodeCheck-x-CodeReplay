const mongoose = require('mongoose')

const { Schema } = mongoose

const UserSchema = Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    profile_image: {
        type: String
    },
    type: {
        type: String,
        enum: ['Learner', 'Mentor'],
        required: true
    },
    auth: {
        username: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        last_login: {
            type: Date,
            default: Date.now,
            get: dt => new Date(dt).toLocaleString()
        },
        date_joined: {
            type: Date,
            default: Date.now,
            get: date => new Date(date).toLocaleDateString()
        }
    }
}, { toObject: { getters: true }, toJSON: { getters: true } })

module.exports = mongoose.model('User', UserSchema)