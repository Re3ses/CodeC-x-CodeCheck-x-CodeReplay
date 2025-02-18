const { UserRepository, LiveCodingRepository } = require('../../repositories')

const start = async (data) => {
    try {
        return await LiveCodingRepository.create(data)
    } catch (e) {
        console.error(e)
    }
}

const serial = async (id) => {
    try {
        return await LiveCodingRepository.get({ filter: { "_id": id } })
    } catch (e) {
        console.error(e)
    }
}

const listSessions = async (filter = null, limit = 0) => {
    try {
        return await LiveCodingRepository.list({ filter, limit })
    } catch (e) {
        console.error(e)
    }
}

const addToSession = async (id, username) => {
    try {
        const learner = await UserRepository.get({ filter: { "auth.username": username } })
        const liveroom = await LiveCodingRepository.get({ filter: { "_id": id } })

        if (!liveroom || liveroom.learners.some(l => l.auth.username === username))
            return null

        return await LiveCodingRepository.update({
            filter: { "_id": id },
            updates: {
                "$addToSet": { "learners": learner }
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const removeFromSession = async (id, username) => {
    try {
        const liveroom = await LiveCodingRepository.get({ filter: { "_id": id } })
        
        if (!liveroom)
            return null
        
        const learner = liveroom.learners.find(l => l.auth.username === username)

        if (!learner)
            return null

        return await LiveCodingRepository.update({
            filter: { "_id": id },
            updates: {
                "$pull": { "learners": learner }
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const liveUpdate = async (data) => {
    try {
        data.editor = await UserRepository.get({ filter: { "auth.username": data.editor } })
        return await LiveCodingRepository.update({
            filter: { "_id": data.id },
            updates: {
                "test_case": data.test_case,
                "live_session.language_used": data.language_used,
                "live_session.code": data.code,
                "live_session.call_link": data.call_link,
                "live_session.editor": data.editor
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const exit = async (id) => {
    try {
        return await LiveCodingRepository.drop({ filter: { "_id": id } })
    } catch (e) {
        console.error(e)
    }
}

module.exports = {
    start,
    serial,
    listSessions,
    addToSession,
    removeFromSession,
    liveUpdate,
    exit
}