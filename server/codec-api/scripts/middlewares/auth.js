const { ACCESS_TOKEN, REFRESH_TOKEN } = require('../../config')

const Tokenizer = require('../utils/tokenize')

const { APIError } = require('../middlewares/errors')
const jwt = require('jsonwebtoken');
const RefreshToken = require('../utils/auth_token');

const authenticate = (req, res, next) => {
    const header = req.headers.authorization
    const token = header && header.split(' ')[1]

    if (!token) 
        throw new APIError("Missing header: {Authorization}", 403)

    jwt.verify(token, ACCESS_TOKEN, (err, user) => {
        if (err)
            throw new APIError(`Authentication failed: [${err.message.toUpperCase()}]`, 401)

        req.user = user
        next()
    })
}

const refresh = (req, res) => {
    const refresh = req.body.token
    var refreshToken = new RefreshToken(refresh)
    
    if (refreshToken.isExpired()) {
        res.status(200).json(refreshToken.generateNewTokens())
    }

    jwt.verify(refresh, REFRESH_TOKEN, (err, user) => {
        if (err)
            throw new APIError(`Refresh failed: [${err.message.toUpperCase()}]`, 401)

        res.status(200).json(Tokenizer.tokenizeUser({ username: user.username, password: user.password }))
    })
}

module.exports = {
    authenticate,
    refresh
}