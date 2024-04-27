const { EventEmitter } = require('events')

const { SubmissionService, CoderoomService, GroupProgressService } = require('../../services')

const GroupProgressEvent = new EventEmitter()

GroupProgressEvent.on('solution', async (slug, username) => {
    const gp = (await CoderoomService.getEnrollee(slug, username)).group_progress
    const enrollees = await GroupProgressService.getEnrollees(slug, gp.id)
    
    let e_solutions = 0
    for (const e of enrollees) {
        e_solutions += (await SubmissionService.listUniqueSubmissionsOf({
            username: e.learner.auth.username,
            slug: slug,
            verdict: "Accepted",
            group: {
                "_id": {
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
        })).length
    }
    GroupProgressService.update({
        filter: { "_id": gp.id },
        updates: {
            "requirements.0.contributions": e_solutions
        }
    })
})

GroupProgressEvent.on('streak', async (slug, username) => {
    const gp = (await CoderoomService.getEnrollee(slug, username)).group_progress
    const enrollees = await GroupProgressService.getEnrollees(slug, gp.id)

    const e_streak = enrollees.map(e => e.streak.current).reduce((a, b) => a + b, 0)
    GroupProgressService.update({
        filter: { "_id": gp.id },
        updates: {
            "requirements.1.contributions": e_streak
        }
    })
})

GroupProgressEvent.on('points', async (slug, username) => {
    const gp = (await CoderoomService.getEnrollee(slug, username)).group_progress
    const enrollees = await GroupProgressService.getEnrollees(slug, gp.id)

    const e_points = enrollees.map(e => e.points).reduce((a, b) => a + b, 0)
    GroupProgressService.update({
        filter: { "_id": gp.id },
        updates: {
            "requirements.2.contributions": e_points
        }
    })
})

GroupProgressEvent.on('language', async (slug, username) => {
    const gp = (await CoderoomService.getEnrollee(slug, username)).group_progress
    const enrollees = await GroupProgressService.getEnrollees(slug, gp.id)

    let e_lang = 0
    for (const e of enrollees) {
        e_lang += (await SubmissionService.listUniqueSubmissionsOf({
            username: e.learner.auth.username,
            slug: slug,
            verdict: "Accepted",
            group: {
                "_id": {
                    language: "$language",
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
        })).length > 1 ? 1 : 0
    }

    GroupProgressService.update({
        filter: { "_id": gp.id },
        updates: {
            "requirements.3.contributions": e_lang
        }
    })
})

module.exports = GroupProgressEvent