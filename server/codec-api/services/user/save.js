const { SaveRepository, UserRepository, CoderoomRepository, ProblemRepository } = require('../../repositories')

const save = async (data) => {
    try {
        data.learner = await UserRepository.get({ filter: { "auth.username": data.learner } })
        data.problem = await ProblemRepository.get({ filter: { "slug": data.problem } })
        data.room = await CoderoomRepository.get({ filter: { "slug": data.room } })
        return await SaveRepository.create(data)
    } catch (e) {
        console.error(e)
    }
}

const serial = async (id) => {
    try {
        return await SaveRepository.get({ filter: { "_id": id } })
    } catch (e) {
        console.error(e)
    }
}

const loadSaves = async (filter = null, limit = 0) => {
    try {
        return await SaveRepository.list({ filter, limit })
    } catch (e) {
        console.error(e)
    }
}

const loadSavesOf = async (username, limit = 0) => {
    try {
        const learner = await UserRepository.get({ filter: { "auth.username": username } })
        return await SaveRepository.list({
            filter: { "learner": learner },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const loadSavesIn = async (slug, limit = 0) => {
    try {
        const problem = await ProblemRepository.get({ filter: { "slug": slug } })
        return await SaveRepository.list({
            filter: { "problem": problem },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const loadSavesFrom = async (slug, limit = 0) => {
    try {
        const room = await CoderoomRepository.get({ filter: { "slug": slug } })
        return await SaveRepository.list({
            filter: { "room": room },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const loadSaveOfInFrom = async (username, problemSlug, roomSlug, language) => {
    try {
        const learner = await UserRepository.get({ filter: { "auth.username": username } })
        const problem = await ProblemRepository.get({ filter: { "slug": problemSlug } })
        const room = await CoderoomRepository.get({ filter: { "slug": roomSlug } })
        return await SaveRepository.get({
            filter: {
                "language": language,
                "learner": learner,
                "problem": problem,
                "room": room 
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const update = async (data) => {
    try {
        return await SaveRepository.update(data)
    } catch (e) {
        console.error(e)
    }
}

module.exports = {
    save,
    serial,
    loadSaves,
    loadSavesOf,
    loadSavesIn,
    loadSavesFrom,
    loadSaveOfInFrom,
    update
}