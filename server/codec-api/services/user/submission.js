const {
    HeartRepository,
    SubmissionRepository,
    UserRepository,
    CoderoomRepository,
    ProblemRepository,
    AttemptTrackerRepository
} = require('../../repositories')

const CoderoomService = require('../coderoom/coderoom')

const submit = async (data) => {
    try {
        data.learner = await UserRepository.get({ filter: { "auth.username": data.learner } })
        data.problem = await ProblemRepository.get({ filter: { "slug": data.problem } })
        data.room = await CoderoomRepository.get({ filter: { "slug": data.room } })
        data.heart = await HeartRepository.get({ filter: { "_id": data.heart } })
        
        const curTime = Date.now()
        if (data.problem && (curTime < new Date(data.problem.release) || curTime > new Date(data.problem.deadline)))
            return null
        if (data.heart && data.heart.lives <= 0)
            return null
        
        await HeartRepository.update({
            filter: { "_id": data.heart.id },
            updates: {
                "$inc": { "lives": -1 }
            }
        })

        const submission = await SubmissionRepository.create(data)
        const enrollee = await CoderoomService.getEnrollee(submission.room.slug, submission.learner.auth.username)

        if (!submission || !enrollee || submission.verdict === "Judging" || submission.verdict === "Wrong Answer")
            return submission

        const similarSubs = await SubmissionRepository.list({
            filter: {
                "learner": enrollee.learner,
                "problem": submission.problem,
                "room": submission.room
            }
        })

        const attempt = await AttemptTrackerRepository.get({
            filter: {
                "learner": enrollee.learner,
                "problem": submission.problem,
                "room": submission.room
            }
        })

        if (!attempt) {
            const attemptNow = Date.now()
            await AttemptTrackerRepository.create({
                date_time: attemptNow,
                attempt_time: Math.trunc((attemptNow - new Date(data.problem.release)) / 1000),
                learner: data.learner,
                problem: data.problem,
                room: data.room
            })
        }

        let startStreakDate = new Date(new Date().toLocaleDateString())
        let endStreakDate = new Date(startStreakDate)
        let beforeStreakDate = new Date(startStreakDate)

        // startStreakDate.setDate(startStreakDate.getDate() + 1)
        endStreakDate.setDate(startStreakDate.getDate() + 1)
        beforeStreakDate.setDate(startStreakDate.getDate() - 1)

        const subsYesterday = await SubmissionRepository.list({
            filter : {
                "learner": enrollee.learner,
                "room": submission.room,
                "date_time": {
                    "$gte": beforeStreakDate,
                    "$lt": startStreakDate
                },
                "$or": [
                    { "verdict": "Accepted" },
                    { "verdict": "Partially Accepted" }
                ]
            }
        })

        const subsToday = await SubmissionRepository.list({
            filter : {
                "learner": enrollee.learner,
                "room": submission.room,
                "date_time": {
                    "$gte": startStreakDate,
                    "$lt": endStreakDate
                },
                "$or": [
                    { "verdict": "Accepted" },
                    { "verdict": "Partially Accepted" }
                ]
            }
        })
        
        const atleastPartialSubs = similarSubs.filter(s => s.verdict !== "Judging" || s.verdict !== "Wrong Answer").sort((a, b) => b.score - a.score)

        const acceptedScores = atleastPartialSubs.filter(s => s.verdict === "Accepted")
        const partialScores = atleastPartialSubs.filter(s => s.verdict !== "Accepted")

        let current = 0, highest = 0, multiplier = parseFloat(enrollee.multiplier)

        if (subsToday && subsToday.length === 1) {
            current = 1
            multiplier = Math.min(multiplier + 0.1, 1.5)
        }

        if ((enrollee.streak.current + current) > 1 && subsYesterday && subsYesterday.length === 0) {
            current = -enrollee.streak.current + 1
            multiplier = 1.1
        }
        
        highest = Math.max(enrollee.streak.current + current, enrollee.streak.highest)

        let points = 0
        // First Time
        if (acceptedScores.length === 1 && partialScores.length === 0) {
            points = acceptedScores[0].score * multiplier
        // Still Not Accepted
        } else if (acceptedScores.length === 0 && partialScores.length > 0) {
            const index = submission.score === partialScores[0].score ? 1 : 0
            const offset = partialScores.length > 1 ? submission.score - partialScores[index].score : submission.score

            points = offset > 0 ? (offset * multiplier) : 0
        // Finally Got Accepted
        } else if (submission.verdict === "Accepted" && acceptedScores.length === 1 && partialScores.length > 0) {
            points = (acceptedScores[0].score - partialScores[0].score) * multiplier
        }

        await CoderoomService.assessEnrollee({
            slug: submission.room.slug,
            username: submission.learner.auth.username,
            updates: {
                "$inc": {
                    "enrollees.$.streak.current": current,
                    "enrollees.$.points": Math.trunc(points)
                },
                "enrollees.$.streak.highest": highest,
                "enrollees.$.multiplier": multiplier
            }
        })

        return await SubmissionRepository.get({ filter: { "_id": submission } })
    } catch (e) {
        console.error(e)
    }
}

const serial = async (id) => {
    try {
        return await SubmissionRepository.get({ filter: { "_id": id } })
    } catch (e) {
        console.error(e)
    }
}

const listSubmissions = async (filter = null, limit = 0) => {
    try {
        return await SubmissionRepository.list({ filter, limit })
    } catch (e) {
        console.error(e)
    }
}

const listSubmissionsOf = async (username, limit = 0) => {
    try {
        const learner = await UserRepository.get({ filter: { "auth.username": username }})
        return await SubmissionRepository.list({
            filter: { "learner": learner },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const listSubmissionsIn = async (slug, limit = 0) => {
    try {
        const problem = await ProblemRepository.get({ filter: { "slug": slug } })
        return await SubmissionRepository.list({
            filter: { "problem": problem },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const listSubmissionsFrom = async (slug, limit = 0) => {
    try {
        const room = await CoderoomRepository.get({ filter: { "slug": slug } })
        return await SubmissionRepository.list({
            filter: { "room": room },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const listSubmissionsOfInFrom = async (username, problemSlug, roomSlug, limit = 0) => {
    try {
        const learner = await UserRepository.get({ filter: { "auth.username": username }})
        const problem = await ProblemRepository.get({ filter: { "slug": problemSlug } })
        const room = await CoderoomRepository.get({ filter: { "slug": roomSlug } })
        return await SubmissionRepository.list({
            filter: {
                "learner": learner,
                "problem": problem,
                "room": room
            },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const listUniqueSubmissionsOf =  async (data) => {
    try {
        const learner = await UserRepository.get({ filter: { "auth.username": data.username }})
        const room = await CoderoomRepository.get({ filter: { "slug": data.slug } })
        return await SubmissionRepository.distinct_list({
            match: {
                "verdict": data.verdict,
                "learner": learner._id,
                "room": room._id
            },
            group: data.group,
            project: data.project
        })
    } catch (e) {
        console.error(e)
    }
}

const updateVerdict = async (data) => {
    try {
        const originalSub = await SubmissionRepository.get(data)

        const submission = await SubmissionRepository.update(data)

        const enrollee = await CoderoomService.getEnrollee(submission.room.slug, submission.learner.auth.username)

        if (originalSub.verdict === "Accepted" && submission && enrollee && submission.verdict !== "Judging" && submission.verdict !== "Wrong Answer") {
            await CoderoomService.assessEnrollee({
                slug: submission.room.slug,
                username: submission.learner.auth.username,
                updates: {
                    "$inc": { "enrollees.$.points": Math.trunc((submission.score - originalSub.score) * parseFloat(enrollee.multiplier)) }
                }
            })
        }
        return submission
    } catch (e) {
        console.error(e)
    }
}

module.exports = {
    submit,
    serial,
    listSubmissions,
    listSubmissionsOf,
    listSubmissionsIn,
    listSubmissionsFrom,
    listSubmissionsOfInFrom,
    listUniqueSubmissionsOf,
    updateVerdict
}