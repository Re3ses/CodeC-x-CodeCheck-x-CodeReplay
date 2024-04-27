const {
    UserRepository,
    BadgeRepository,
    CoderoomRepository,
    GroupProgressRepository,
    ProblemRepository,
    AttemptTrackerRepository
} = require('../../repositories')

const { Randomizer } = require('../../scripts')

const publish = async (data) => {
    try {
        data.mentor = await UserRepository.get({ filter: { "auth.username": data.mentor } })
        return await CoderoomRepository.create(data)
    } catch (e) {
        console.error(e)
    }
}

const serial = async (id) => {
    try {
        return await CoderoomRepository.get({ filter: { "_id": id }})
    } catch (e) {
        console.error(e)
    }
}

const inspect = async (slug) => {
    try {
        return await CoderoomRepository.get({ filter: { "slug": slug } })
    } catch (e) {
        console.error(e)
    }
}

const getEnrollee = async (slug, username) => {
    try {
        const room = await CoderoomRepository.get({ filter: { "slug": slug } })

        if (!room)
            return null

        return room.enrollees.find(e => e.learner.auth.username === username) || null
    } catch (e) {
        console.error(e)
    }
}

const listRooms = async (filter = { "is_archived": false }, limit = 0) => {
    try {
        return await CoderoomRepository.list({ filter, limit })
    } catch (e) {
        console.error(e)
    }
}

const listRoomsBy = async (username, is_archived = false, limit = 0) => {
    try {
        const mentor = await UserRepository.get({ filter: { "auth.username": username } })
        return await CoderoomRepository.list({
            filter: {
                "is_archived": is_archived,
                "mentor": mentor
            },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const listRoomsOf = async (username, is_archived = false, limit = 0) => {
    try {
        const learner = await UserRepository.get({ filter: { "auth.username": username } })
        return await CoderoomRepository.list({
            filter: {
                "is_archived": is_archived,
                "enrollees.learner": learner
            },
            limit
        })
    } catch (e) {
        console.error(e)
    }
}

const listEnrolleesByPoints = async (slug, limit = 5) => {
    try {
        const room = await CoderoomRepository.get({ filter: { "slug": slug } })
        const attempts = await AttemptTrackerRepository.list({ filter: { "room": room } })
        const enrollees = room.enrollees

        if (!room || !enrollees)
            return null

        var e_atts = {}
        attempts.forEach((att) => {
            const uname = att.learner.auth.username
            if (!(uname in e_atts)) e_atts[uname] = att.attempt_time
            else e_atts[uname] += att.attempt_time
        })

        return enrollees.sort((a, b) =>
            b.points - a.points ||
            e_atts[a.learner.auth.username] - e_atts[b.learner.auth.username]
        ).slice(0, limit)
    } catch (e) {
        console.error(e)
    }
}

const listBadgesOf = async (slug, username) => {
    try {
        const room = await CoderoomRepository.get({ filter: { "slug": slug } })

        if (!room)
            return null

        return room.enrollees.find(e => e.learner.auth.username === username).badges || null
    } catch (e) {
        console.error(e)
    }
}

const archiving = async (slug, is_archived = true) => {
    try {
        return await CoderoomRepository.update({
            filter: { "slug": slug },
            updates: {
                "is_archived": is_archived
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const enroll = async (slug, username) => {
    try {
        const learner = await UserRepository.get({ filter: { "auth.username": username } })
        const room = await CoderoomRepository.get({ filter: { "slug": slug } })

        let groupings = await GroupProgressRepository.list({
            filter: {
                "room": room,
                "available_slot": { "$gt": 0 }
            }
        })
        
        if (!learner || !room)
            return null

        if (room.type === TYPES[0])
            groupings = null

        if (room.enrollees.some(e => e.learner.auth.username === username))
            return null

        let progress = null
        if (groupings && groupings.length >= 1) {
            progress = Randomizer.randomizeList(groupings)
            
            await GroupProgressRepository.update({
                filter: { "_id": progress.id },
                updates: {
                    "$inc": { "available_slot": -1 }
                }
            })
        }

        return await CoderoomRepository.update({
            filter: { "slug": slug },
            updates: {
                "$push": {
                    "enrollees": {
                        "learner": learner,
                        "group_progress": progress,
                        "points": 0,
                        "multiplier": 1,
                        "streak": {
                            "current": 0,
                            "highest": 0
                        },
                        "badges": [],
                        "featured_badge": null
                    }
                }
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const unenroll = async (slug, username) => {
    try {
        const enrollee = await getEnrollee(slug, username)

        if (!enrollee)
            return null

        if (enrollee.group_progress)
            await GroupProgressRepository.update({
                filter: { "_id": enrollee.group_progress.id },
                updates: {
                    "$inc": { "available_slot": 1 }
                }
            })

        return await CoderoomRepository.update({
            filter: { "slug": slug },
            updates: {
                "$pull": { "enrollees": { "_id": enrollee } }
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const postProblem = async (roomSlug, problemSlug) => {
    try {
        const problem = await ProblemRepository.get({ filter: { "slug": problemSlug }})

        if (!problem || problem.is_archived)
            return null

        if ((await CoderoomRepository.get({ filter: { "problems": problem._id } })))
            return null

        return await CoderoomRepository.update({
            filter: { "slug": roomSlug },
            updates: {
                "$addToSet": { "problems": problem }
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const removeProblem = async (roomSlug, problemSlug) => {
    try {
        const problem = await ProblemRepository.get({ filter: { "slug": problemSlug }})

        if (!problem || problem.is_archived)
            return null

        return await CoderoomRepository.update({
            filter: { "slug": roomSlug },
            updates: {
                "$pull": { "problems": problem._id }
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const update = async (data) => {
    try {
        return await CoderoomRepository.update(data)
    } catch (e) {
        console.error(e)
    }
}

const assessEnrollee = async (data) => {
    try {
        const learner = await UserRepository.get({ filter: { "auth.username": data.username } })
        return await CoderoomRepository.update({
            filter: {
                "slug": data.slug, "enrollees.learner": learner
            },
            updates: data.updates
        })
    } catch (e) {
        console.error(e)
    }
}

const rewardEnrollee = async (data) => {
    try {
        const enrollee = await getEnrollee(data.slug, data.username)

        if (!enrollee)
            return null

        const learner = enrollee.learner
        const badge = await BadgeRepository.get({ filter: { "_id": data.badge } })

        return await CoderoomRepository.update({
            filter: {
                "slug": data.slug, "enrollees.learner": learner
            },
            updates: {
                "$addToSet": {
                    "enrollees.$.badges": badge
                }
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const setFeaturedBadge = async (data) => {
    try {
        const enrollee = await getEnrollee(data.slug, data.username)

        const badge = enrollee.badges.find((b) => b.id === data.badge) || null
        
        return await CoderoomRepository.update({
            filter: {
                "slug": data.slug, "enrollees.learner": enrollee.learner
            },
            updates: {
                "enrollees.$.featured_badge": badge
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const unpublish = async (slug) => {
    try {
        return await CoderoomRepository.drop({ filter: { "slug": slug } })
    } catch (e) {
        console.error(e)
    }
} 

const TYPES = CoderoomRepository.TYPES

module.exports = {
    publish,
    serial,
    inspect,
    getEnrollee,
    listRooms,
    listRoomsBy,
    listRoomsOf,
    listEnrolleesByPoints,
    listBadgesOf,
    archiving,
    enroll,
    unenroll,
    postProblem,
    removeProblem,
    update,
    assessEnrollee,
    rewardEnrollee,
    setFeaturedBadge,
    unpublish,
    TYPES
}