const router = require('express').Router()

const { SaveService } = require('../../services')

const { authenticate } = require('../../scripts').Authenticator

const { APIError, DocumentNotFoundError, wrapper } = require('../../scripts').Errors

// GET
router.get('/', authenticate, wrapper(async (req, res) => {
    const limit = req.query.limit || 0
    const saves = await SaveService.loadSaves(null, limit)
    
    if (!saves || saves.length === 0)
        throw new DocumentNotFoundError("No saves found")
        
    res.status(200).json(saves)
}))

router.get('/get', authenticate, wrapper(async (req, res) => {
    const { username, problem_slug, room_slug, language } = req.query

    if (!username)
        throw new APIError(`Missing query parameter: {username}`, 400)
    if (!problem_slug)
        throw new APIError(`Missing query parameter: {problem_slug}`, 400)
    if (!room_slug)
        throw new APIError(`Missing query parameter: {room_slug}`, 400)
    if (!language)
        throw new APIError(`Missing query parameter: {language}`, 400)

    const save = await SaveService.loadSaveOfInFrom(username, problem_slug, room_slug, language)

    if (!save)
        throw new DocumentNotFoundError(`Save of [${username}] in [${problem_slug}] from [${room_slug}] using [${language}}] not found`)

    res.status(200).json(save)
}))

router.get('/:id', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const save = await SaveService.serial(req.params.id)

    if (!save)
        throw new DocumentNotFoundError(`Save [${req.params.id}] not found`)

    res.status(200).json(save)
}))

router.get('/learner/:username', authenticate, wrapper(async (req, res) => {
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)

    const limit = req.query.limit || 0
    const saves = await SaveService.loadSavesOf(req.params.username, limit)

    if (!saves || saves.length === 0)
        throw new DocumentNotFoundError(`Saves of [${req.params.username}] not found`)

    res.status(200).json(saves)
}))

router.get('/problem/:slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const limit = req.query.limit || 0
    const saves = await SaveService.loadSavesIn(req.params.slug, limit)
    
    if (!saves || saves.length === 0)
        throw new DocumentNotFoundError(`Saves in [${req.params.slug}] not found`)

    res.status(200).json(saves)
}))

router.get('/room/:slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const limit = req.query.limit || 0
    const saves = await SaveService.loadSavesFrom(req.params.slug, limit)
    
    if (!saves || saves.length === 0)
        throw new DocumentNotFoundError(`Saves from [${req.params.slug}] not found`)

    res.status(200).json(saves)
}))

// POST
router.post('/save', authenticate, wrapper(async (req, res) => {
    const newSave = await SaveService.save(req.body)

    if (!newSave)
        throw new APIError("Saving failed", 400)

    res.status(201).json(newSave)
}))

// PATCH
router.patch('/:id', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const save = await SaveService.update({
        filter: { "_id": req.params.id },
        updates: req.body
    })

    if (!save)
        throw new APIError("Save update failed", 400)

    res.status(200).json(save)
}))

module.exports = router