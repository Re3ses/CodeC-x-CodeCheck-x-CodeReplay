const { CoderoomRepository, GroupProgressRepository, LiveCodingRepository } = require('../../repositories')

const setup = async (data) => {
    try {
        data.room = await CoderoomRepository.get({ filter: { "slug": data.room } })

        if (!data.room || data.room.type === CoderoomRepository.TYPES[0])
            return null
        
        data.liveroom = await LiveCodingRepository.create({
            test_case: "",
            language_used: "",
            code: "",
            call_link: ""
        })
        
        return await GroupProgressRepository.create(data)
    } catch (e) {
        console.error(e)
    }
}

const serial = async (id) => {
    try {
        return await GroupProgressRepository.get({ filter: { "_id": id } })
    } catch (e) {
        console.error(e)
    }
}

const getEnrollees = async (slug, gp_id) => {
    try {
        const room = await CoderoomRepository.get({ filter: { "slug": slug } })

        if (!room)
            return null

        return room.enrollees.filter(e => e.group_progress.id === gp_id)
    } catch (e) {
        console.error(e)
    }
}

const listProgresses = async (filter = null, limit = 0) => {
    try {
        return await GroupProgressRepository.list({ filter, limit })
    } catch (e) {
        console.error(e)
    }
}

const listProgressesFrom = async (slug, limit = 0) => {
    try {
        const room = await CoderoomRepository.get({ filter: { "slug": slug } })
        return await GroupProgressRepository.list({
            filter: { "room": room },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const update = async (data) => {
    try {
        return await GroupProgressRepository.update(data)
    } catch (e) {
        console.error(e)
    }
}

const remove = async (id) => {
    try {
        return await GroupProgressRepository.drop({ filter: { "_id": id } })
    } catch (e) {
        console.error(e)
    }
}

module.exports = {
    setup,
    serial,
    getEnrollees,
    listProgresses,
    listProgressesFrom,
    update,
    remove
}