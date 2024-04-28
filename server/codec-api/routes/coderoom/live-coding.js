const router = require('express').Router()

const { LiveCodingService } = require('../../services')

const { authenticate } = require('../../scripts').Authenticator

const { APIError, DocumentNotFoundError, wrapper } = require('../../scripts').Errors

// GET
router.get('/', authenticate, wrapper(async (req, res) => {
    const limit = req.query.limit || 0
    const sessions = await LiveCodingService.listSessions(null, limit)
    
    if (!sessions || sessions.length === 0)
        throw new DocumentNotFoundError("No sessions found")

    res.status(200).json(sessions)
}))

router.get('/:id', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const session = await LiveCodingService.serial(req.params.id)
    
    if (!session)
        throw new DocumentNotFoundError(`Session [${req.params.id}] not found`)

    res.status(200).json(session)
}))

// POST
router.post('/start', authenticate, wrapper(async (req, res) => {
    const newSession = await LiveCodingService.start(req.body)

    if (!newSession)
        throw new APIError("Start failed", 400)

    res.status(201).json(newSession)
}))

// PATCH
router.patch('/:id/add', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)
    if (!req.body.username)
        throw new APIError(`Missing body parameter: {username}`, 400)

    const session = await LiveCodingService.addToSession(req.params.id, req.body.username)

    if (!session)
        throw new APIError("Session User invite failed", 400)

    res.status(200).json(session)
}))

router.patch('/:id/remove', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)
    if (!req.body.username)
        throw new APIError(`Missing body parameter: {username}`, 400)

    const session = await LiveCodingService.removeFromSession(req.params.id, req.body.username)

    if (!session)
        throw new APIError("Session User removal failed", 400)

    res.status(200).json(session)
}))

// Not relevant at the moment since liveUpdate service is handled using sockets
router.patch('/:id/live-update', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const session = await LiveCodingService.liveUpdate({
        id: req.params.id,
        ...req.body
    })

    if (!session)
        throw new APIError("Session live update failed", 400)

    res.status(200).json(session)
}))

// DELETE
router.delete('/:id/end', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const session = await LiveCodingService.exit(req.params.id)
    
    if (!session)
        throw new APIError("Session exit failed", 400)

    res.status(200).json(session)
}))

module.exports = router