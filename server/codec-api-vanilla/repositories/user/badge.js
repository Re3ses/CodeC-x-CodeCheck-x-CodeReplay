const { Badge } = require('../../models')

const create = async (data) => {
    const badge = new Badge({
        name: data.name,
        description: data.description,
        type: data.type,
        condition: data.condition,
        filename: data.filename
    })
    return await badge.save()
}

const get = async ({ filter }) => {
    return await Badge.findOne(filter)
}

const list = async ({ filter, limit = 0 }) => {
    return await Badge.find(filter).limit(limit)
}

const update = async ({ filter, updates }) => {
    const badge = await Badge.findOneAndUpdate(filter, updates, { new: true })
    return badge.save() // Band-aid fix for update Bug on validation
}

const drop = async ({ filter }) => {
    return await Badge.findOneAndDelete(filter)
}

module.exports = {
    create,
    get,
    list,
    update,
    drop
}