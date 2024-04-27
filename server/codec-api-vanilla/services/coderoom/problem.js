const { UserRepository, ProblemRepository } = require('../../repositories')

const publish = async (data) => {
    try {
        data.mentor = await UserRepository.get({ filter: { "auth.username": data.mentor } })
        return await ProblemRepository.create(data)
    } catch (e) {
        console.error(e)
    }
}

const serial = async (id) => {
    try {
        return await ProblemRepository.get({ filter: { "_id": id } })
    } catch (e) {
        console.error(e)
    }
}

const inspect = async (slug) => {
    try {
        return await ProblemRepository.get({ filter: { "slug": slug } })
    } catch (e) {
        console.error(e)
    }
} 

const listProblems = async (filter = { "is_archived": false }, limit = 0) => {
    try {
        return await ProblemRepository.list({ filter, limit })
    } catch (e) {
        console.error(e)
    }
}

const listProblemsBy = async (username, is_archived = false, limit = 0) => {
    try {
        const mentor = await UserRepository.get({ filter: { "auth.username": username } })

        if (!mentor || mentor.type !== UserRepository.TYPES[1])
            return null

        return await ProblemRepository.list({
            filter: {
                "is_archived": is_archived,
                "mentor": mentor
            },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const archiving = async (slug, is_archived = true) => {
    try {
        return await ProblemRepository.update({
            filter: { "slug": slug },
            updates: {
                "is_archived": is_archived
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const reschedule = async (data) => {
    try {
        return await ProblemRepository.update({
            filter: { "slug": data.slug },
            updates: {
                "release": data.release,
                "deadline": data.deadline
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const unpublish = async (slug) => {
    try {
        return await ProblemRepository.drop({ filter: { "slug": slug }})
    } catch (e) {
        console.error(e)
    }
}

const DIFFICULTIES = ProblemRepository.DIFFICULTIES

module.exports = {
    publish,
    serial,
    inspect,
    listProblems,
    listProblemsBy,
    archiving,
    reschedule,
    unpublish,
    DIFFICULTIES
}