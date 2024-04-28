const { GroupProgress } = require('../../models')

const create = async (data) => {
    const progress = new GroupProgress({
        requirements: data.requirements,
        room: data.room,
        liveroom: data.liveroom
    })
    return await progress.save()
}

const get = async ({ filter }) => {
    return await GroupProgress.findOne(filter)
    .populate('room')
    .populate('liveroom')
}

const list = async ({ filter, limit = 0 }) => {
    return await GroupProgress.find(filter).limit(limit)
    .populate('room')
    .populate('liveroom')
}

const update = async ({ filter, updates }) => {
    const progress = await GroupProgress.findOneAndUpdate(filter, updates, { new: true })
    .populate('room')
    .populate('liveroom')
    return await progress.save() // Band-aid fix for update Bug on validation
}

const drop = async ({ filter }) => {
    return await GroupProgress.findOneAndDelete(filter)
    .populate('room')
    .populate('liveroom')
}

module.exports = {
    create,
    get,
    list,
    update,
    drop
}