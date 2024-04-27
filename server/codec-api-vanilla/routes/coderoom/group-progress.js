const router = require('express').Router()

const { GroupProgressService } = require('../../services')

const { authenticate } = require('../../scripts').Authenticator

const { APIError, DocumentNotFoundError, wrapper } = require('../../scripts').Errors

// GET
router.get('/', authenticate, wrapper(async (req, res) => {
    const limit = req.query.limit || 0
    const gps = await GroupProgressService.listProgresses(null, limit)
    
    if (!gps || gps.length === 0)
        throw new DocumentNotFoundError("No group progresses found")

    res.status(200).json(gps)
}))

router.get('/:id', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const gp = await GroupProgressService.serial(req.params.id)

    if (!gp)
        throw new DocumentNotFoundError(`Group Progress [${req.params.id}] not found`)

    res.status(200).json(gp)
}))

router.get('/:id/enrollees/:slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const enrollees = await GroupProgressService.getEnrollees(req.params.slug, req.params.id)

    if (!enrollees || enrollees.length === 0)
        throw new DocumentNotFoundError(`Enrollees from [${req.params.slug}] not found`)

    res.status(200).json(enrollees)
}))

router.get('/room/:slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const limit = req.query.limit || 0
    const gps = await GroupProgressService.listProgressesFrom(req.params.slug, limit)
    
    if (!gps || gps.length === 0)
        throw new DocumentNotFoundError(`Group Progresses from [${req.params.slug}] not found`)

    res.status(200).json(gps)
}))

// POST
router.post('/setup', authenticate, wrapper(async (req, res) => {
    const newGP = await GroupProgressService.setup(req.body)
    
    if (!newGP)
        throw new APIError("Setup failed", 400)

    res.status(201).json(newGP)
}))

// PATCH
router.patch('/:id', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const gp = await GroupProgressService.update({
        filter: { "_id": req.params.id },
        updates: req.body
    })
    
    if (!gp)
        throw new APIError("Group Progress update failed", 400)

    res.status(200).json(gp)
}))

// DELETE
router.delete('/:id', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const gp = await GroupProgressService.remove(req.params.id)

    if (!gp)
        throw new APIError("Group Progress deletion failed", 400)

    res.status(200).json(gp)
}))

module.exports = router