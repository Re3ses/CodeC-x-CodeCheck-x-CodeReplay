const { Problem } = require('../../models')

const create = async (data) => {
    const problem = new Problem({
        name: data.name,
        description: data.description,
        input_format: data.input_format,
        output_format: data.output_format,
        constraints: data.constraints,
        release: data.release,
        deadline: data.deadline,
        difficulty: data.difficulty,
        languages: data.languages,
        test_cases: data.test_cases,
        mentor: data.mentor
    })
    return await problem.save()
}

const get = async ({ filter }) => {
    return await Problem.findOne(filter)
    .populate('mentor')
}

const list = async ({ filter, limit = 0 }) => {
    return await Problem.find(filter).limit(limit)
    .populate('mentor')
}

const update = async ({ filter, updates }) => {
    const problem = await Problem.findOneAndUpdate(filter, updates, { new: true })
    .populate('mentor')
    return await problem.save() // Band-aid fix for update Bug on validation
}

const drop = async ({ filter }) => {
    return await Problem.findOneAndDelete(filter)
    .populate('mentor')
}

const DIFFICULTIES = Problem.schema.path('difficulty').enumValues

module.exports = {
    create,
    get,
    list,
    update,
    drop,
    DIFFICULTIES
}