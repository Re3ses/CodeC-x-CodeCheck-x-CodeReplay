// Config and Scripts
const { API_PORT } = require('../config')

const { MongoDB } = require('../scripts')

// API Server
const express = require('express')
const cors = require('cors')

const app = express()

// Middlewares
app.use(express.json())
app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000',
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