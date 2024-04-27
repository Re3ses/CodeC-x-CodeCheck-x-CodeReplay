const bcrypt = require('bcrypt')

const hash = async (data) => {
    try {
        return await bcrypt.hash(data, 10)
    } catch (e) {
        console.log(e)
    }
}

const match = async (plain, hashed) => {
    try {
        return await bcrypt.compare(plain, hashed)
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    hash,
    match
}