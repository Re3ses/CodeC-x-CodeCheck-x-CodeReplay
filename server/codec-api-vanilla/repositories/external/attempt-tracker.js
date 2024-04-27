const { AttemptTracker } = require('../../models')

const create = async (data) => {
    const tracker = new AttemptTracker({
        date_time: data.date_time,
        attempt_time: data.attempt_time,
        learner: data.learner,
        problem: data.problem,
        room: data.room
    })
    return await tracker.save()
}

const get = async ({ filter }) => {
    return await AttemptTracker.findOne(filter)
    .populate('learner')
    .populate('problem')
    .populate('room')
}

const list = async ({ filter, limit = 0 }) => {
    return await AttemptTracker.find(filter).limit(limit)
    .populate('learner')
    .populate('problem')
    .populate('room')
}

const update = async ({ filter, updates }) => {
    const attempt =  await AttemptTracker.findOneAndUpdate(filter, updates, { new: true })
    .populate('learner')
    .populate('problem')
    .populate('room')
    return attempt.save() // Band-aid fix for update Bug on validation
}

const drop = async ({ filter }) => {
    return await AttemptTracker.findOneAndDelete(filter)
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