const { UserRepository } = require('../../repositories')

const { Hasher } = require('../../scripts')

const register = async (data) => {
    try {
        data.password = await Hasher.hash(data.password)
        return await UserRepository.create(data)
    } catch (e) {
        console.error(e)
    }
}

const serial = async (id) => {
    try {
        return await UserRepository.get({ filter: { "_id": id } })
    } catch (e) {
        console.error(e)
    }
}

const profile = async (username) => {
    try {
        return await UserRepository.get({ filter: { "auth.username": username } })
    } catch (e) {
        console.error(e)
    }
}

const email = async (email) => {
    try {
        return await UserRepository.get({ filter: { "auth.email": email } })
    } catch (e) {
        console.error(e)
    }
}

const listUsers = async (filter = null, limit = 0) => {
    try {
        return await UserRepository.list({ filter, limit })
    } catch (e) {
        console.error(e)
    }
}

const listUsersBy = async (type = 'Learner', limit = 0) => {
    try {
        return await UserRepository.list({
            filter: { "type": type },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const update = async (data) => {
    try {
        return await UserRepository.update(data)
    } catch (e) {
        console.error(e)
    }
}

const changePassword = async (data) => {
    try {
        const user = await UserRepository.get(data)

        if (!user)
            return null

        if ((await Hasher.match(data.password, user.auth.password)))
            return await UserRepository.update({ 
                filter: data.filter,
                updates: {
                    "auth.password": (await Hasher.hash(data.new_password))
                }
            })
        return false
    } catch (e) {
        console.error(e)
    }
}

const forgotPassword = async (data) => {
    try {
        const user = await UserRepository.get(data)

        if (!user)
            return null
        
        return await UserRepository.update({
            filter: data.filter,
            updates: {
                "auth.password": (await Hasher.hash(data.new_password))
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const TYPES = UserRepository.TYPES

module.exports = {
    register,
    serial,
    profile,
    email,
    listUsers,
    listUsersBy,
    update,
    changePassword,
    forgotPassword,
    TYPES 
}