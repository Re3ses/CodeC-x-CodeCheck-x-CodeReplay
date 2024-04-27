const { ACCESS_TOKEN, REFRESH_TOKEN } = require('../../config')

const jwt = require('jsonwebtoken')

const tokenizeUser = (user) => {
    return {
        "access_token": jwt.sign(user, ACCESS_TOKEN, { expiresIn: '20m' }),
        "refresh_token": jwt.sign(user, REFRESH_TOKEN, { expiresIn: '12h' })
    }
}

module.exports = {
    tokenizeUser
}