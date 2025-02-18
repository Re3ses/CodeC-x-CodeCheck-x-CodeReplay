const { User } = require('../../models')

const create = async (data) => {
    const user = new User({
        first_name: data.first_name,
        last_name: data.last_name,
        profile_image: "",
        type: data.type,
        auth: {
            username: data.username,
            password: data.password,
            email: data.email,
        }
    })
    return await user.save()
}

const get = async ({ filter }) => {
    return await User.findOne(filter)
}

const list = async ({ filter, limit = 0 }) => {
    return await User.find(filter).limit(limit)
}

const update = async ({ filter, updates }) => {
    const user = await User.findOneAndUpdate(filter, updates, { new: true })
    return user.save() // Band-aid fix for update Bug on validation
}

const drop = async ({ filter }) => {
    return await User.findOneAndDelete(filter)
}

const TYPES = User.schema.path('type').enumValues

module.exports = {
    create,
    get,
    list,
    update,
    drop,
    TYPES
}