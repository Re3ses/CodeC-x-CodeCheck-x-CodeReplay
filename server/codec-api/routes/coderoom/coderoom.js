const router = require('express').Router()

const { CoderoomService, HeartService } = require('../../services')

const { AchievementEmitter, EmailNotificationEmitter } = require('../../events')

const { authenticate } = require('../../scripts').Authenticator

const { APIError, DocumentNotFoundError, wrapper } = require('../../scripts').Errors

// GET
router.get('/', authenticate, wrapper(async (req, res) => {
    const is_archived = req.query.is_archived || false
    const limit = req.query.limit || 0
    const rooms = await CoderoomService.listRooms({ "is_archived": is_archived }, limit)

    if (!rooms || rooms.length === 0)
        throw new DocumentNotFoundError("No rooms found")

    res.status(200).json(rooms)
}))

router.get('/types', (req, res) => {
    res.status(200).json({ "types": CoderoomService.TYPES })
})

router.get('/:slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const room = await CoderoomService.inspect(req.params.slug)

    if (!room)
        throw new DocumentNotFoundError(`Coderoom [${req.params.slug}] not found`)

    res.status(200).json(room)
}))

router.get('/:slug/enrollees', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)
    
    const room = await CoderoomService.inspect(req.params.slug)

    if (!room)
        throw new DocumentNotFoundError(`Coderoom [${req.params.slug}] not found`)
    if (!room.enrollees || room.enrollees.length === 0)
        throw new DocumentNotFoundError(`Enrollees from [${req.params.slug}] not found`)
    
    res.status(200).json(room.enrollees)
}))

router.get('/:slug/enrollees/:username', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)

    const enrollee = await CoderoomService.getEnrollee(req.params.slug, req.params.username)

    if (!enrollee)
        throw new DocumentNotFoundError(`Enrollee [${req.params.username}] from [${req.params.slug}] not found`)

    res.status(200).json(enrollee)
}))

router.get('/:slug/badges/:username', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)

    const badges = await CoderoomService.listBadgesOf(req.params.slug, req.params.username)

    if (!badges || badges.length === 0)
        throw new DocumentNotFoundError(`Badges of [${req.params.username}] from [${req.params.slug}] not found`)

    res.status(200).json(badges)
}))

router.get('/:slug/leaderboards', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const limit = req.query.limit || 5
    const rankings = await CoderoomService.listEnrolleesByPoints(req.params.slug, limit)

    if (!rankings || rankings.length === 0)
        throw new DocumentNotFoundError("Coderoom Enrollees ranking not found")

    AchievementEmitter.emit('ranking', req.params.slug, rankings)

    res.status(200).json(rankings)
}))

router.get('/mentor/:username', authenticate, wrapper(async (req, res) => {
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)

    const is_archived = req.query.is_archived || false
    const limit = req.query.limit || 0
    const rooms = await CoderoomService.listRoomsBy(req.params.username, is_archived, limit)

    if (!rooms || rooms.length === 0)
        throw new DocumentNotFoundError(`Coderooms by [${req.params.username}] not found`)

    res.status(200).json(rooms)
}))

router.get('/learner/:username', authenticate, wrapper(async (req, res) => {
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)

    const limit = req.query.limit || 0
    const rooms = await CoderoomService.listRoomsOf(req.params.username, false, limit)

    if (!rooms || rooms.length === 0)
        throw new DocumentNotFoundError(`Coderooms of [${req.params.username}] not found`)

    res.status(200).json(rooms)
}))

router.get('/type/:type', authenticate, wrapper(async (req, res) => {
    if (!req.params.type)
        throw new APIError("Missing parameter: {type}", 400)

    const is_archived = req.query.is_archived || false
    const limit = req.query.limit || 0
    const rooms = await CoderoomService.listRooms({
        "type": req.params.type,
        "is_archived": is_archived
    }, limit)

    if (!rooms || rooms.length === 0)
        throw new DocumentNotFoundError(`No Coderooms of type [${req.params.type}]`)
    
    res.status(200).json(rooms)
}))

// POST
router.post('/publish', authenticate, wrapper(async (req, res) => {
    const newRoom = await CoderoomService.publish(req.body)
    
    if (!newRoom)
        throw new APIError("Publish failed", 400)

    res.status(201).json(newRoom)
}))

// PATCH
router.patch('/:slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const room = await CoderoomService.update({
        filter: { "slug": req.params.slug },
        updates: req.body
    })

    if (!room)
        throw new APIError("Coderoom update failed", 400)

    res.status(200).json(room)
}))

router.patch('/:slug/enroll/:username', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)

    const room = await CoderoomService.enroll(req.params.slug, req.params.username)
    
    if (!room)
        throw new APIError("Coderoom enroll Enrollee failed", 400)
    
    const enrollee = await CoderoomService.getEnrollee(req.params.slug, req.params.username)
    
    if (!enrollee)
        throw new DocumentNotFoundError(`Enrollee [${req.params.username}] not found`)

    const username = enrollee.learner.auth.username
    for (const problem of room.problems) {
        const heart = await HeartService.getLifeOfInFrom(username, problem.slug, room.slug)
        if (!heart) {
            await HeartService.giveLife({
                "lives": 5,
                "learner": username,
                "problem": problem.slug,
                "room": room.slug
            })
        }
    }

    res.status(200).json(room)
}))

router.patch('/:slug/unenroll/:username', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)

    const room = await CoderoomService.unenroll(req.params.slug, req.params.username)
    
    if (!room)
        throw new APIError("Coderoom unenroll Enrollee failed", 400)

    res.status(200).json(room)
}))

router.patch('/:room_slug/post/:problem_slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.room_slug)
        throw new APIError(`Missing parameter: {room_slug}`, 400)
    if (!req.params.problem_slug)
        throw new APIError(`Missing parameter: {problem_slug}`, 400)

    const room = await CoderoomService.postProblem(req.params.room_slug, req.params.problem_slug)

    if (!room)
        throw new APIError("Coderoom post Problem failed", 400)

    for (const e of room.enrollees) {
        const username = e.learner.auth.username
        const heart = await HeartService.getLifeOfInFrom(username, req.params.problem_slug, req.params.room_slug)
        if (!heart) {
            await HeartService.giveLife({
                "lives": 5,
                "learner": username,
                "problem": req.params.problem_slug,
                "room": req.params.room_slug
            })
        }
    }

    EmailNotificationEmitter.emit('new-problem', req.params.room_slug, req.params.problem_slug)

    res.status(200).json(room)
}))

router.patch('/:room_slug/remove/:problem_slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.room_slug)
        throw new APIError(`Missing parameter: {room_slug}`, 400)
    if (!req.params.problem_slug)
        throw new APIError(`Missing parameter: {problem_slug}`, 400)

    const room = await CoderoomService.removeProblem(req.params.room_slug, req.params.problem_slug)

    if (!room)
        throw new APIError("Coderoom remove Problem failed", 400)

    res.status(200).json(room)
}))

router.patch('/:slug/enrollees/:username', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)

    let updates = {}
    for (let key in req.body) {
        updates[`enrollees.$.${key}`] = req.body[key]
    }
    
    const room = await CoderoomService.assessEnrollee({
        slug: req.params.slug,
        username: req.params.username,
        updates: updates
    })

    if (!room)
        throw new APIError("Coderoom Enrollee update failed", 400)

    res.status(200).json(room)
}))

router.patch('/:slug/enrollees/:username/badges/:order', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)
    if (!req.params.order)
        throw new APIError("Missing parameter: {order}", 400)

    const badges = await CoderoomService.listBadgesOf(req.params.slug, req.params.username)

    if (!badges || badges.length <= req.params.order)
        throw new DocumentNotFoundError("Coderoom Enrollee Badge order not viewable")

    let updates = {}
    updates[`enrollees.$.badges.${req.params.order}.is_viewed`] = true

    const room = await CoderoomService.assessEnrollee({
        slug: req.params.slug,
        username: req.params.username,
        updates: updates
    })

    if (!room)
        throw new APIError("Coderoom Enrollee update failed", 400)

    res.status(200).json(room)
}))

router.patch('/:slug/reward', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)
    if (!req.body.username)
        throw new APIError(`Missing body parameter: {username}`, 400)
    if (!req.body.badge)
        throw new APIError(`Missing body parameter: {badge}`, 400)

    const room = await CoderoomService.rewardEnrollee({
        slug: req.params.slug,
        username: req.body.username,
        badge: req.body.badge
    })
    
    if (!room)
        throw new APIError(`Coderoom Enrollee reward Badge failed`, 400)
    
    res.status(200).json(room)
}))

router.patch('/:slug/feature', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)
    if (!req.body.username)
        throw new APIError(`Missing body parameter: {username}`, 400)
    if (!req.body.badge)
        throw new APIError(`Missing body parameter: {badge}`, 400)

    const room = await CoderoomService.setFeaturedBadge({
        slug: req.params.slug,
        username: req.body.username,
        badge: req.body.badge
    })

    if (!room)
        throw new APIError(`Coderoom Enrollee feature Badge failed`, 400)

    res.status(200).json(room)
}))

router.patch('/:slug/archiving', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)
    
    const room = await CoderoomService.archiving(req.params.slug, req.body.is_archived)
    
    if (!room)
        throw new APIError("Coderoom archiving failed", 400)

    res.status(200).json(room)
}))

// DELETE
router.delete('/:slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const room = await CoderoomService.unpublish(req.params.slug)

    if (!room)
        throw new APIError("Coderoom unpublish failed", 400)

    res.status(200).json(room)
}))

module.exports = router