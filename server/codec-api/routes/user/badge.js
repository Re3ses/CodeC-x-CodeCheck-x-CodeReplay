const router = require('express').Router()

const { BadgeService } = require('../../services')

const { authenticate } = require('../../scripts').Authenticator

const { APIError, DocumentNotFoundError, wrapper } = require('../../scripts').Errors

// GET
router.get('/', authenticate, wrapper(async (req, res) => {
    const limit = req.query.limit || 0
    const badges = await BadgeService.listBadges(null, limit)

    if (!badges || badges.length === 0)
        throw new DocumentNotFoundError("No badges found")
    
    res.status(200).json(badges)
}))

router.get('/:id', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const badge = await BadgeService.serial(req.params.id)

    if (!badge)
        throw new DocumentNotFoundError(`Badge [${req.params.id}] not found`)

    res.status(200).json(badge)
}))

router.get('/type/:type', authenticate, wrapper(async (req, res) => {
    if (!req.params.type)
        throw new APIError("Missing parameter: {type}", 400)

    const limit = req.query.limit || 0
    const badges = await BadgeService.listBadgesBy(req.params.type, limit)

    if (!badges || badges.length === 0)
        throw new DocumentNotFoundError(`No Badge of type [${req.params.type}]`)

    res.status(200).json(badges)
}))

// POST
router.post('/upload', wrapper(async (req, res) => {
    const newBadge = await BadgeService.upload(req.body)
    
    if (!newBadge)
        throw new APIError("Upload failed", 400)

    res.status(201).json(newBadge)
}))

// PATCH
router.patch('/:id', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const badge = await BadgeService.update({
        filter: { "_id": req.params.id },
        updates: req.body
    })

    if (!badge)
        throw new APIError("Badge update failed", 400)

    res.status(200).json(badge)
}))

// DELETE
router.delete('/:id', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const badge = await BadgeService.remove(req.params.id)

    if (!badge)
        throw new APIError("Badge deletion failed", 400)

    res.status(200).json(badge)
}))

module.exports = router