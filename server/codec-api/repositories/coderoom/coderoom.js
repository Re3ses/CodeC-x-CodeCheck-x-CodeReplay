const { Coderoom } = require('../../models')

const create = async (data) => {
    const coderoom = new Coderoom({
        name: data.name,
        description: data.description,
        type: data.type,
        enrollees: [],
        problems: [],
        mentor: data.mentor
    })
    return await coderoom.save()
}

const get = async ({ filter }) => {
    return await Coderoom.findOne(filter)
    .populate('enrollees.learner')
    .populate('enrollees.badges')
    .populate('enrollees.featured_badge')
    .populate('problems')
    .populate('mentor')
    .populate({
        path: 'enrollees.group_progress',
        match: { 'type': 'Cooperative' }
    })
}

const list = async ({ filter, limit = 0 }) => {
    return await Coderoom.find(filter).limit(limit)
    .populate('enrollees.learner')
    .populate('enrollees.badges')
    .populate('enrollees.featured_badge')
    .populate('problems')
    .populate('mentor')
    .populate({
        path: 'enrollees.group_progress',
        match: { 'type': 'Cooperative' }
    })
}

const update = async ({ filter, updates }) => {
    const coderoom = await Coderoom.findOneAndUpdate(filter, updates, { new: true })
    .populate('enrollees.learner')
    .populate('enrollees.badges')
    .populate('enrollees.featured_badge')
    .populate('problems')
    .populate('mentor')
    .populate({
        path: 'enrollees.group_progress',
        match: { 'type': 'Cooperative' }
    })
    return await coderoom.save() // Band-aid fix for update Bug on validation
}

const drop = async ({ filter }) => {
    return await Coderoom.findOneAndDelete(filter)
    .populate('enrollees.learner')
    .populate('enrollees.badges')
    .populate('enrollees.featured_badge')
    .populate('problems')
    .populate('mentor')
    .populate({
        path: 'enrollees.group_progress',
        match: { 'type': 'Cooperative' }
    })
}

const TYPES = Coderoom.schema.path('type').enumValues

module.exports = {
    create,
    get,
    list,
    update,
    drop,
    TYPES
}