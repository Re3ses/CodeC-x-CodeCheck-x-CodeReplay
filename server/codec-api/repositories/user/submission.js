const { Submission } = require('../../models')

const create = async (data) => {
    const submission = new Submission({
        language: data.language,
        code: data.code,
        score: data.score,
        verdict: data.verdict,
        time_complexity: data.time_complexity,
        space_complexity: data.space_complexity,
        heart: data.heart,
        learner: data.learner,
        problem: data.problem,
        room: data.room
    })
    return await submission.save()
}

const get = async ({ filter }) => {
    return await Submission.findOne(filter)
    .populate('heart')
    .populate('learner')
    .populate('problem')
    .populate('room')
}

const list = async ({ filter, limit = 0 }) => {
    return await Submission.find(filter).limit(limit)
    .populate('heart')
    .populate('learner')
    .populate('problem')
    .populate('room')
}

const distinct_list = async ({ match, group, project }) => {
    const submissions = await Submission.aggregate([
        { "$match": match },
        { "$group": group },
        { "$project": project }
    ])
    return await Submission.populate(submissions, [{ path: "learner" }, { path: "problem" }, { path: "room" } ])
}

const update = async ({ filter, updates }) => {
    const submission = await Submission.findOneAndUpdate(filter, updates, { new: true })
    .populate('heart')
    .populate('learner')
    .populate('problem')
    .populate('room')
    return submission.save() // Band-aid fix for update Bug on validation
}

const drop = async ({ filter }) => {
    return await Submission.findOneAndDelete(filter)
    .populate('heart')
    .populate('learner')
    .populate('problem')
    .populate('room')
}

module.exports = {
    create,
    get,
    list,
    distinct_list,
    update,
    drop
}