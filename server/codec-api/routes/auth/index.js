const router = require('express').Router()

const { UserService } = require('../../services')

const { Authenticator, Errors, Hasher, Tokenizer } = require('../../scripts')

const { APIError, DocumentNotFoundError, wrapper } = Errors

// POST
router.post('/refresh', wrapper(Authenticator.refresh))

router.post('/login', wrapper(async (req, res) => {
    const { username, password } = req.body

    if (!username)
        throw new APIError("Missing body parameter: {username}", 400)
    if (!password)
        throw new APIError("Missing body parameter: {password}", 400)

    const user = await UserService.profile(username)

    if (!user)
        throw new DocumentNotFoundError("User not found")

    if (!(await Hasher.match(password, user.auth.password)))
        throw new APIError("Incorrect User credentials", 400)
    
    await UserService.update({
        filter: { "auth.username": username },
        updates: {
            "auth.last_login": Date.now()
        }
    })
    
    const token = Tokenizer.tokenizeUser({ username: username, password: user.auth.password })
    res.status(200).json(token)
}))

// Logout to be implemented client-side
module.exports = router