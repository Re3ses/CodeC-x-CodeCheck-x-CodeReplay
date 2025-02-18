
const randomizeList = (list) => {
    return list[Math.floor(Math.random() * list.length)]
}

module.exports = {
    randomizeList
}