const { LiveCoding } = require('../../models')

const create = async (data) => {
    const liveroom = new LiveCoding({
        test_case: data.test_case,
        live_session: {
            language_used: data.language_used,
            code: data.code,
            call_link: data.call_link,
            editor: null
        },
        learners: []
    })
    return await liveroom.save()
}

const get = async ({ filter }) => {
    return await LiveCoding.findOne(filter)
    .populate('live_session.editor')
    .populate('learners')
}

const list = async ({ filter, limit = 0 }) => {
    return await LiveCoding.find(filter).limit(limit)
    .populate('live_session.editor')
    .populate('learners')
}

const update = async ({ filter, updates }) => {
    const liveroom =  await LiveCoding.findOneAndUpdate(filter, updates, { new: true })
    .populate('live_session.editor')
    .populate('learners')
    return liveroom.save() // Band-aid fix for update Bug on validation
}

const drop = async ({ filter }) => {
    return await LiveCoding.findOneAndDelete(filter)
    .populate('live_session.editor')
    .populate('learners')
}

module.exports = {
    create,
    get,
    list,
    update,
    drop    
}