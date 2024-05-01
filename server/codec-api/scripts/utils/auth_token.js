const Tokenizer = require('../utils/tokenize')

const jwt = require('jsonwebtoken');

class AuthToken {
    constructor(refreshToken) {
        this.refreshToken = refreshToken
    }

    tokenPayload = ''

    isExpired() {
        const expirationTime = this.getRefreshTokenExpiration()
        const currentTime = Date.now()
        return currentTime > expirationTime
    }
    
    getRefreshTokenExpiration() {
        this.tokenPayload = this.parseJwt(this.refreshToken); 
        // Convert expiration time to milliseconds
        return this.tokenPayload.exp * 1000; 
    }
    
    parseJwt() {
        try {
            return jwt.decode(this.refreshToken);
        } catch (error) {
            console.log('Error parsing JWT:', error.message);
        }
    }

    generateNewTokens() {
        return Tokenizer.tokenizeUser({ 
            username: this.tokenPayload.username, 
            password: this.tokenPayload.password
        })
    }
}

module.exports = AuthToken;