const router = require('express').Router()

const { AttemptTrackerService } = require('../../services')

const { authenticate } = require('../../scripts').Authenticator

const { APIError, DocumentNotFoundError, wrapper } = require('../../scripts').Errors

// GET
router.get('/', authenticate, wrapper(async (req, res) => {
    const limit = req.query.limit || 0
    const attempts = await AttemptTrackerService.listAttempts(null, limit)

    if (!attempts || attempts.length === 0)
        throw new DocumentNotFoundError("No attempts found")

    res.status(200).json(attempts)
}))

router.get('/get', authenticate, wrapper(async (req, res) => {
    const { username, problem_slug, room_slug } = req.query

    if (!username)
        throw new APIError(`Missing query parameter: {username}`, 400)
    if (!problem_slug)
        throw new APIError(`Missing query parameter: {problem_slug}`, 400)
    if (!room_slug)
        throw new APIError(`Missing query parameter: {room_slug}`, 400)

    const attempts = await AttemptTrackerService.listAttemptsOfInFrom(username, problem_slug, room_slug)

    if (!attempts || attempts.length === 0)
        throw new DocumentNotFoundError(`Attempt of [${username}] in [${problem_slug}] from [${room_slug}] not found`)

    res.status(200).json(attempts)
}))

router.get('/:id', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const attempt = await AttemptTrackerService.serial(req.params.id)
    
    if (!attempt)
        throw new DocumentNotFoundError(`Attempt [${req.params.id}] not found`)

    res.status(200).json(attempt)
}))

router.get('/learner/:username', authenticate, wrapper(async (req, res) => {
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)

    const limit = req.query.limit || 0
    const attempts = await AttemptTrackerService.listAttemptsOf(req.params.username, limit)

    if (!attempts || attempts.length === 0)
        throw new DocumentNotFoundError(`Attempts of [${req.params.username}] not found`)

    res.status(200).json(attempts)
}))

router.get('/problem/:slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const limit = req.query.limit || 0
    const attempts = await AttemptTrackerService.listAttemptsIn(req.params.slug, limit)
    
    if (!attempts || attempts.length === 0)
        throw new DocumentNotFoundError(`Attempts in [${req.params.slug}] not found`)

    res.status(200).json(attempts)
}))

router.get('/room/:slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const limit = req.query.limit || 0
    const attempts = await AttemptTrackerService.listAttemptsFrom(req.params.slug, limit)
    
    if (!attempts || attempts.length === 0)
        throw new DocumentNotFoundError(`Attempts from [${req.params.slug}] not found`)

    res.status(200).json(attempts)
}))

// POST
router.post('/track', authenticate, wrapper(async (req, res) => {
    const newAttempt = await AttemptTrackerService.attempt(req.body)
    
    if (!newSave)
        throw new APIError("Attempt failed", 400)

    res.status(201).json(newAttempt)
}))

module.exports = router