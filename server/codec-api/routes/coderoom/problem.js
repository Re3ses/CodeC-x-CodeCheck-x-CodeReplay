const router = require('express').Router()

const { ProblemService } = require('../../services')

const { authenticate } = require('../../scripts').Authenticator

const { APIError, DocumentNotFoundError, wrapper } = require('../../scripts').Errors

// GET
router.get('/', authenticate, wrapper(async (req, res) => {
    const is_archived = req.query.is_archived || false
    const limit = req.query.limit || 0
    const problems = await ProblemService.listProblems({ "is_archived": is_archived }, limit)

    if (!problems || problems.length === 0)
        throw new DocumentNotFoundError("No problems found")

    res.status(200).json(problems)
}))

router.get('/difficulties', (req, res) => {
    res.status(200).json({ "difficulties": ProblemService.DIFFICULTIES })
})

router.get('/:slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const problem = await ProblemService.inspect(req.params.slug)

    if (!problem)
        throw new DocumentNotFoundError(`Problem [${req.params.slug}] not found`)

    res.status(200).json(problem)
}))

router.get('/mentor/:username', authenticate, wrapper(async (req, res) => {
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)

    const is_archived = req.query.is_archived || false
    const limit = req.query.limit || 0
    const problems = await ProblemService.listProblemsBy(req.params.username, is_archived, limit)
    
    if (!problems || problems.length === 0)
        throw new DocumentNotFoundError(`Problems by [${req.params.username}] not found`)

    res.status(200).json(problems)
}))

// POST
router.post('/publish', authenticate, wrapper(async (req, res) => {
    const newProblem = await ProblemService.publish(req.body)

    if (!newProblem)
        throw new APIError("Publish failed", 400)

    res.status(201).json(newProblem)
}))

// PATCH
router.patch('/:slug/archiving', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const problem = await ProblemService.archiving(req.params.slug, req.body.is_archived)

    if (!problem)
        throw new APIError("Problem archiving failed", 400)

    res.status(200).json(problem)
}))

router.patch('/:slug/reschedule', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const { release, deadline } = req.body
    
    if (!release)
        throw new APIError(`Missing body parameter: {release}`, 400)
    if (!deadline)
        throw new APIError(`Missing body parameter: {deadline}`, 400)

    const problem = await ProblemService.reschedule({
        slug: req.params.slug,
        release: release,
        deadline: deadline
    })

    if (!problem)
        throw new APIError("Problem rescheduling failed", 400)

    res.status(200).json(problem)
}))

// DELETE
router.delete('/:slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const problem = await ProblemService.unpublish(req.params.slug)
    
    if (!problem)
        throw new APIError("Problem unpublish failed", 400)

    res.status(200).json(problem)
}))

module.exports = router