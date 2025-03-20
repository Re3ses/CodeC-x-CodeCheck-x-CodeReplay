const router = require('express').Router()

const { UserService } = require('../../services')

const { EmailNotificationEmitter } = require('../../events')

const { authenticate } = require('../../scripts').Authenticator

const { APIError, DocumentNotFoundError, wrapper } = require('../../scripts').Errors

// GET
router.get('/', authenticate, wrapper(async (req, res) => {
    const limit = req.query.limit || 0
    const users = await UserService.listUsers(null, limit)

    if (!users || users.length === 0)
        throw new DocumentNotFoundError("No users found")

    res.status(200).json(users)
}))

router.get('/health', (req, res) => {
    // print to console that a health check was requested.
    console.log('Health check requested in user.js')
    res.status(200).json({ status: 'ok', message: 'API is running' });
})

router.get('/types', (req, res) => {
    res.status(200).json({ "types": UserService.TYPES })
})

router.get('/validate', wrapper(async (req, res) => {
    const { username, email } = req.query
    const test_1 = await UserService.profile(username)
    const test_2 = await UserService.email(email)

    res.status(200).json({ username: (username !== undefined && test_1 !== null), email: (email !== undefined && test_2 !== null) })
}))

router.get('/:username', authenticate, wrapper(async (req, res) => {
    // Print to console that a user profile was requested.
    // console.log('User profile requested')
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)

    const user = await UserService.profile(req.params.username)

    if (!user)
        throw new DocumentNotFoundError(`User [${req.params.username}] not found`)

    res.status(200).json(user)
}))

router.get('/type/:type', authenticate, wrapper(async (req, res) => {
    if (!req.params.type)
        throw new APIError("Missing parameter: {type}", 400)

    const limit = req.query.limit || 0
    const users = await UserService.listUsersBy(req.params.type, limit)

    if (!users || users.length === 0)
        throw new DocumentNotFoundError(`No Users of type [${req.params.type}]`)

    res.status(200).json(users)
}))

// POST
router.post('/register', wrapper(async (req, res) => {
    const newUser = await UserService.register(req.body)

    if (!newUser)
        throw new APIError("Registration failed", 400)

    EmailNotificationEmitter.emit('signup', newUser.auth.username)

    res.status(200).json(newUser)
}))

// PATCH
router.patch('/:username', authenticate, wrapper(async (req, res) => {
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)

    const user = await UserService.update({
        filter: { "auth.username": req.params.username },
        updates: req.body
    })

    if (!user)
        throw new APIError("User update failed", 400)

    res.status(200).json(user)
}))

router.patch('/:username/change-pass', authenticate, wrapper(async (req, res) => {
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)
    if (!req.body.password)
        throw new APIError("Missing body parameter: {password}", 400)
    if (!req.body.new_password)
        throw new APIError("Missing body parameter: {new_password}", 400)

    const changed = await UserService.changePassword({
        filter: { "auth.username": req.params.username },
        password: req.body.password,
        new_password: req.body.new_password
    })

    if (changed === null)
        throw new DocumentNotFoundError(`User [${req.params.username}] not found`)

    let data = { code: 400, message: "Password not matched" }
    if (changed) {
        data.code = 200,
            data.message = "Password changed"
        EmailNotificationEmitter.emit('change-password', req.params.username)
    }

    res.status(data.code).json({ message: data.message })
}))

router.patch('/:email/forgot-pass', authenticate, wrapper(async (req, res) => {
    if (!req.params.email)
        throw new APIError("Missing parameter: {username}", 400)
    if (!req.body.new_password)
        throw new APIError("Missing body parameter: {new_password}", 400)

    const forgot = await UserService.forgotPassword({
        filter: { "auth.email": req.params.email },
        new_password: req.body.new_password
    })

    if (!forgot)
        throw new DocumentNotFoundError(`User [${req.params.email} not found]`)

    res.status(200).json({ message: "Password changed" })
}))

module.exports = router