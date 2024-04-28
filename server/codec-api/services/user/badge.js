const { BadgeRepository } = require('../../repositories')

const upload = async (data) => {
    try {
        return await BadgeRepository.create(data)
    } catch (e) {
        console.error(e)
    }
}

const serial = async (id) => {
    try {
        return await BadgeRepository.get({ filter: { "_id": id } })
    } catch (e) {
        console.error(e)
    }
}

const listBadges = async (filter = null, limit = 0) => {
    try {
        return await BadgeRepository.list({ filter, limit })
    } catch (e) {
        console.error(e)
    }
}

const listBadgesBy = async (type, limit = 0) => {
    try {
        return await BadgeRepository.list({
            filter: { "type": type },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const update = async (data) => {
    try {
        return await BadgeRepository.update(data)
    } catch (e) {
        console.error(e)
    }
}

const remove = async (id) => {
    try {
        return await BadgeRepository.drop({ filter: { "_id": id } })
    } catch (e) {
        console.error(e)
    }
}

module.exports = {
    upload,
    serial,
    listBadges,
    listBadgesBy,
    update,
    remove
}