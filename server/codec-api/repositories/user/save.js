const { Save } = require('../../models')

const create = async (data) => {
    const save = new Save({
        language: data.language,
        code: data.code,
        learner: data.learner,
        problem: data.problem,
        room: data.room
    })
    return await save.save()
}

const get = async ({ filter }) => {
    return await Save.findOne(filter)
    .populate('learner')
    .populate('problem')
    .populate('room')
}

const list = async ({ filter, limit = 0 }) => {
    return await Save.find(filter).limit(limit)
    .populate('learner')
    .populate('problem')
    .populate('room')
}

const update = async ({ filter, updates }) => {
    return await Save.findOneAndUpdate(filter, updates, { new: true })
    .populate('learner')
    .populate('problem')
    .populate('room')
}

const drop = async ({ filter }) => {
    return await Save.findOneAndDelete(filter)
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