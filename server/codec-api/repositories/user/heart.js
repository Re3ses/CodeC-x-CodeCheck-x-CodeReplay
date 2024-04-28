const { Heart } = require('../../models')

const create = async (data) => {
    const heart = new Heart({
        lives: data.lives,
        learner: data.learner,
        problem: data.problem,
        room: data.room
    })
    return await heart.save()
}

const get = async ({ filter }) => {
    return await Heart.findOne(filter)
    .populate('learner')
    .populate('problem')
    .populate('room')
}

const list = async ({ filter, limit = 0 }) => {
    return await Heart.find(filter).limit(limit)
    .populate('learner')
    .populate('problem')
    .populate('room')
}

const update = async ({ filter, updates }) => {
    const heart = await Heart.findOneAndUpdate(filter, updates, { new: true })
    .populate('learner')
    .populate('problem')
    .populate('room')
    return await heart.save() // Band-aid fix for update Bug on validation
}

const drop = async ({ filter }) => {
    return await Heart.findOneAndDelete(filter)
    .populate('learner')
    .populate('problem')
    .populate('room')
}

module.exports = {
    create,
    get,
    list,
    update,
    drop
}