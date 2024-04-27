// Config and Scripts
const { AUTH_PORT } = require('../config')

// Authentication Server
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
app.use('/auth', require('../routes/auth'))
app.use(require('../scripts').Errors.handler)

app.listen(AUTH_PORT, () => {
    console.log(`Auth Server listening at port ${AUTH_PORT}...`)
})

module.exports = app