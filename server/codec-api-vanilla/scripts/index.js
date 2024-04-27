// Wrapper module

module.exports = {
    MongoDB: require('./database/connection'),
    Authenticator: require('./middlewares/auth'),
    Errors: require('./middlewares/errors'),
    Hasher: require('./utils/hash'),
    Logger: require('./utils/logger'),
    Mailer: require('./utils/mailer'),
    Randomizer: require('./utils/random'),
    Tokenizer: require('./utils/tokenize')
}