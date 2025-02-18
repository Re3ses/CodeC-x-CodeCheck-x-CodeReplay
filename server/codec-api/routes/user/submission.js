const router = require('express').Router()

const { SubmissionService, CoderoomService } = require('../../services')

const { AchievementEmitter, GroupProgressEmitter } = require('../../events')

const { authenticate } = require('../../scripts').Authenticator

const { APIError, DocumentNotFoundError, wrapper } = require('../../scripts').Errors

// GET
router.get('/', authenticate, wrapper(async (req, res) => {
    const limit = req.query.limit || 0
    const submissions = await SubmissionService.listSubmissions(null, limit)

    if (!submissions || submissions.length === 0)
        throw new DocumentNotFoundError("No submissions found")
        
    res.status(200).json(submissions)
}))

router.get('/get', authenticate, wrapper(async (req, res) => {
    const { username, problem_slug, room_slug } = req.query

    if (!username)
        throw new APIError(`Missing query parameter: {username}`, 400)
    if (!problem_slug)
        throw new APIError(`Missing query parameter: {problem_slug}`, 400)
    if (!room_slug)
        throw new APIError(`Missing query parameter: {room_slug}`, 400)

    const limit = req.query.limit || 0
    const submissions = await SubmissionService.listSubmissionsOfInFrom(username, problem_slug, room_slug, limit)

    if (!submissions || submissions.length === 0)
        throw new DocumentNotFoundError(`Submissions of [${username}] in [${problem_slug}] from [${room_slug}] not found`)

    res.status(200).json(submissions)
}))

router.get('/:id', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const submission = await SubmissionService.serial(req.params.id)

    if (!submission)
        throw new DocumentNotFoundError(`Submission [${req.params.id}] not found`)

    res.status(200).json(submission)
}))

router.get('/learner/:username', authenticate, wrapper(async (req, res) => {
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)

    const limit = req.query.limit || 0
    const submissions = await SubmissionService.listSubmissionsOf(req.params.username, limit)

    if (!submissions || submissions.length === 0)
        throw new DocumentNotFoundError(`Submissions of [${req.params.username}] not found`)

    res.status(200).json(submissions)
}))

router.get('/learner/:username/unique', authenticate, wrapper(async (req, res) => {
    if (!req.params.username)
        throw new APIError("Missing parameter: {username}", 400)

    const language = req.query.include_language ? { language: "$language" } : {}

    if (!req.query.slug)
        throw new APIError(`Missing query parameter: {slug}`, 400)
    if (!req.query.verdict)
        throw new APIError(`Missing query parameter: {verdict}`, 400)

    const submissions = await SubmissionService.listUniqueSubmissionsOf({
        username: req.params.username,
        slug: req.query.slug,
        verdict: req.query.verdict,
        group: {
            "_id": {
                ...language,
                learner: "$learner",
                problem: "$problem",
                room: "$room"
            },
            "language": { "$last": "$language" },
            "verdict": { "$last": "$verdict" },
            "heart": { "$last": "$heart" },
            "learner": { "$last": "$learner" },
            "problem": { "$last": "$problem" },
            "room": { "$last": "$room" }
        },
        project: {
            "_id": 0,
            "language": 1,
            "score": 1,
            "verdict": 1,
            "heart": 1,
            "learner": 1,
            "problem": 1,
            "room": 1
        }
    })

    if (!submissions || submissions.length === 0)
        throw new DocumentNotFoundError(`Unique Submissions of [${req.params.username}] not found`)

    if (submissions[0].room.type === CoderoomService.TYPES[0]) {
        if (Object.keys(language).length === 0) {
            AchievementEmitter.emit('solution', req.query.slug, req.params.username, submissions)
            AchievementEmitter.emit('heart', req.query.slug, req.params.username, submissions)
        } else {
            AchievementEmitter.emit('language', req.query.slug, req.params.username, submissions)
        }
    } else {
        GroupProgressEmitter.emit('solution', req.query.slug, req.params.username)
        GroupProgressEmitter.emit('language', req.query.slug, req.params.username)
    }

    res.status(200).json(submissions)
}))

router.get('/problem/:slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const limit = req.query.limit || 0
    const submissions = await SubmissionService.listSubmissionsIn(req.params.slug, limit)
    
    if (!submissions || submissions.length === 0)
        throw new DocumentNotFoundError(`Submissions in [${req.params.slug}] not found`)

    res.status(200).json(submissions)
}))

router.get('/room/:slug', authenticate, wrapper(async (req, res) => {
    if (!req.params.slug)
        throw new APIError("Missing parameter: {slug}", 400)

    const limit = req.query.limit || 0
    const submissions = await SubmissionService.listSubmissionsFrom(req.params.slug, limit)
    
    if (!submissions || submissions.length === 0)
        throw new DocumentNotFoundError(`Submissions from [${req.params.slug}] not found`)

    res.status(200).json(submissions)
}))

// POST
router.post('/submit', authenticate, wrapper(async (req, res) => {
    const newSubmission = await SubmissionService.submit(req.body)
    
    if (!newSubmission)
        throw new APIError("Submit failed", 400)
    
    if (newSubmission.room.type === CoderoomService.TYPES[0]) {
        AchievementEmitter.emit('points', newSubmission.room.slug, newSubmission.learner.auth.username)
        AchievementEmitter.emit('streak', newSubmission.room.slug, newSubmission.learner.auth.username)
    } else {
        GroupProgressEmitter.emit('streak', newSubmission.room.slug, newSubmission.learner.auth.username)
        GroupProgressEmitter.emit('points', newSubmission.room.slug, newSubmission.learner.auth.username)
    }

    res.status(201).json(newSubmission)
}))

// PATCH
router.patch('/:id/verdict', authenticate, wrapper(async (req, res) => {
    if (!req.params.id)
        throw new APIError("Missing parameter: {id}", 400)

    const submission = await SubmissionService.updateVerdict({
        filter: { "_id": req.params.id },
        updates: req.body
    })
    
    if (!submission)
        throw new APIError("Submission update failed", 400)
        
    if (submission.room.type === CoderoomService.TYPES[0]) {
        AchievementEmitter.emit('points', submission.room.slug, submission.learner.auth.username)
        AchievementEmitter.emit('streak', submission.room.slug, submission.learner.auth.username)
    } else {
        GroupProgressEmitter.emit('streak', submission.room.slug, submission.learner.auth.username)
        GroupProgressEmitter.emit('points', submission.room.slug, submission.learner.auth.username)
    }

    res.status(200).json(submission)
}))

module.exports = router