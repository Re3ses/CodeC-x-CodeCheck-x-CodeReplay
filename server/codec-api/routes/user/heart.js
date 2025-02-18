const router = require('express').Router()

const { HeartService } = require('../../services')

const { authenticate } = require('../../scripts').Authenticator

const { APIError, DocumentNotFoundError, wrapper } = require('../../scripts').Errors

// GET
router.get('/', authenticate, wrapper(async (req, res) => {
    const limit = req.query.limit || 0
    const hearts = await HeartService.listLives(null, limit)

    if (!hearts || hearts.length === 0)
        throw new DocumentNotFoundError("No hearts found")

    res.status(200).json(hearts)
}))

router.get('/get', authenticate, wrapper(async (req, res) => {
    const { username, problem_slug, room_slug } = req.query

    if (!username)
        throw new APIError(`Missing query parameter: {username}`, 400)
    if (!problem_slug)
        throw new APIError(`Missing query parameter: {problem_slug}`, 400)
    if (!room_slug)
        throw new APIError(`Missing query parameter: {room_slug}`, 400)

    const heart = await HeartService.getLifeOfInFrom(username, problem_slug, room_slug)

    if (!heart)
        throw new DocumentNotFoundError(`Heart of [${username}] in [${problem_slug}] from [${room_slug}] not found`)

    res.status(200).json(heart)
}))

router.get('/:id', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const heart = await HeartService.serial(req.params.id)

    if (!heart)
        throw new DocumentNotFoundError(`Heart [${req.params.id}] not found`)

    res.status(200).json(heart)
}))

router.get ('/learner/:username', authenticate, wrapper(async (req, res) => {
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)

    const limit = req.query.limit || 0
    const hearts = await HeartService.listLivesOf(req.params.username, limit)

    if (!hearts || hearts.length === 0)
        throw new DocumentNotFoundError(`Hearts of [${req.params.username}] not found`)

    res.status(200).json(hearts)
}))

router.get('/problem/:slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const limit = req.query.limit || 0
    const hearts = await HeartService.listLivesIn(req.params.slug, limit)

    if (!hearts || hearts.length === 0)
        throw new DocumentNotFoundError(`Hearts in [${req.params.slug}] not found`)
    
    res.status(200).json(hearts)
}))

router.get('/room/:slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const limit = req.query.limit || 0
    const hearts = await HeartService.listLivesFrom(req.params.slug, limit)

    if (!hearts || hearts.length === 0)
        throw new DocumentNotFoundError(`Hearts from [${req.params.slug}] not found`)

    res.status(200).json(hearts)
}))

// POST
router.post('/init', authenticate, wrapper(async (req, res) => {
    const newHeart = await HeartService.giveLife(req.body)

    if (!newHeart)
        throw new APIError("Give life failed", 400)

    res.status(201).json(newHeart)
}))

// PATCH
router.patch('/:id/depl', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const heart = await HeartService.depleteLife(req.params.id)

    if (!heart)
        throw new APIError("Heart deplete failed", 400)

    res.status(200).json(heart)
}))

module.exports = router