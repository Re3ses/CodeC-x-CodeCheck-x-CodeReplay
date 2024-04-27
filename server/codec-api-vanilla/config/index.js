// Configure environment
require('dotenv').config()

module.exports = {
    API_PORT: process.env.API_PORT,
    AUTH_PORT: process.env.AUTH_PORT,
    SOCKET_PORT: process.env.SOCKET_PORT,

    MONGODB_URI: process.env.MONGODB_URI,

    ACCESS_TOKEN: process.env.ACCESS_TOKEN,
    REFRESH_TOKEN: process.env.REFRESH_TOKEN,

    MAILER_USERNAME: process.env.MAILER_USERNAME,
    MAILER_PASSWORD: process.env.MAILER_PASSWORD
}