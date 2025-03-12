// Config and Scripts
const { API_PORT } = require('../config')

const { MongoDB } = require('../scripts')

// API Server
const express = require('express')
const cors = require('cors')

const app = express()
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : "http://localhost:3000"

// Middlewares
app.use(express.json())
app.use(cors({
    credentials: true,
    origin: allowedOrigins,
    methods: [
        'GET', 'POST', 'PATCH', 'DELETE'
    ]
}))

// Routing
app.use('/static', express.static('public'))
app.use('/api', require('../routes'))
app.use(require('../scripts').Errors.handler)

MongoDB.connect()

app.listen(API_PORT, () => {
    console.log(`API Server listening at port ${API_PORT}...`)
})

module.exports = app