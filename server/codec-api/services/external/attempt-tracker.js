const { 
    UserRepository,
    CoderoomRepository,
    ProblemRepository,
    AttemptTrackerRepository
} = require('../../repositories')

const attempt = async (data) => {
    try {
        data.learner = await UserRepository.get({ filter: { "auth.username": data.learner } })
        data.problem = await ProblemRepository.get({ filter: { "slug": data.problem } })
        data.room = await CoderoomRepository.get({ filter: { "slug": data.room } })
        
        if (!data.learner || !data.problem || !data.room)
            return null

        return await AttemptTrackerRepository.create(data)
    } catch (e) {
        console.error(e)
    }
}

const serial = async (id) => {
    try {
        return await AttemptTrackerRepository.get({ filter: { "_id": id } })
    } catch (e) {
        console.error(e)
    }
}

const listAttempts = async (filter = null, limit = 0) => {
    try {
        return await AttemptTrackerRepository.list({ filter, limit })
    } catch (e) {
        console.log("error")
        console.error(e)
    }
}

const listAttemptsOf = async (username, limit = 0) => {
    try {
        const learner = await UserRepository.get({ filter: { "auth.username": username } })
        return await AttemptTrackerRepository.list({
            filter: { "learner": learner },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const listAttemptsIn = async (slug, limit = 0) => {
    try {
        const problem = await ProblemRepository.get({ filter: { "slug": slug } })
        return await AttemptTrackerRepository.list({
            filter: { "problem": problem },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const listAttemptsFrom = async (slug, limit = 0) => {
    try {
        const room = await CoderoomRepository.get({ filter: { "slug": slug } })
        return await AttemptTrackerRepository.list({
            filter: { "room": room },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const listAttemptsOfInFrom = async (username, problemSlug, roomSlug, limit = 0) => {
    try {
        const learner = await UserRepository.get({ filter: { "auth.username": username } })
        const problem = await ProblemRepository.get({ filter: { "slug": problemSlug } })
        const room = await CoderoomRepository.get({ filter: { "slug": roomSlug } })
        return await AttemptTrackerRepository.list({
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

module.exports = {
    attempt,
    serial,
    listAttempts,
    listAttemptsOf,
    listAttemptsIn,
    listAttemptsFrom,
    listAttemptsOfInFrom
}