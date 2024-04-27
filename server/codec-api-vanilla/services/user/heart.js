const { UserRepository, HeartRepository, CoderoomRepository, ProblemRepository } = require('../../repositories')

const giveLife = async (data) => {
    try {
        data.learner = await UserRepository.get({ filter: { "auth.username": data.learner } })
        data.problem = await ProblemRepository.get({ filter: { "slug": data.problem } })
        data.room = await CoderoomRepository.get({ filter: { "slug": data.room } })
        return await HeartRepository.create(data)
    } catch (e) {
        console.error(e)
    }
}

const serial = async (id) => {
    try {
        return await HeartRepository.get({ filter: { "_id": id } })
    } catch (e) {
        console.error(e)
    }
}

const listLives = async (filter = null, limit = 0) => {
    try {
        return await HeartRepository.list({ filter, limit })
    } catch (e) {
        console.error(e)
    }
}

const listLivesOf = async (username, limit = 0) => {
    try {
        const learner = await UserRepository.get({ filter: { "auth.username": username } })
        return await HeartRepository.list({
            filter: { "learner": learner },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const listLivesIn = async (slug, limit = 0) => {
    try {
        const problem = await ProblemRepository.get({ filter: { "slug": slug } })
        return await HeartRepository.list({
            filter: { "problem": problem },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const listLivesFrom = async (slug, limit = 0) => {
    try {
        const room = await CoderoomRepository.get({ filter: { "slug": slug } })
        return await HeartRepository.list({
            filter: { "room": room },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const getLifeOfInFrom = async (username, problemSlug, roomSlug) => {
    try {
        const learner = await UserRepository.get({ filter: { "auth.username": username } })
        const problem = await ProblemRepository.get({ filter: { "slug": problemSlug } })
        const room = await CoderoomRepository.get({ filter: { "slug": roomSlug } })
        return await HeartRepository.get({
            filter: {
                "learner": learner,
                "problem": problem,
                "room": room 
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const depleteLife = async (id) => {
    try {
        return await HeartRepository.update({
            filter: { "_id": id },
            updates: {
                "$inc": { "lives": -1 }
            }
        })
    } catch (e) {
        console.error(e)
    }
}

module.exports = {
    giveLife,
    serial,
    listLives,
    listLivesOf,
    listLivesIn,
    listLivesFrom,
    getLifeOfInFrom,
    depleteLife
}