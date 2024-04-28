const { EventEmitter } = require('events')

const { BadgeService, CoderoomService } = require('../../services')

const AchievementEvent = new EventEmitter()

AchievementEvent.on('points', async (slug, username) => {
    const room = await CoderoomService.inspect(slug)
    const enrollee = await CoderoomService.getEnrollee(slug, username)
    const badges = await BadgeService.listBadgesBy('points')

    if (!room || !enrollee || !badges)
        return
    if (room.type !== CoderoomService.TYPES[0])
        return
    
    for (const badge of badges) {
        if (enrollee.points >= badge.condition) {
            if (!enrollee.badges.some(b => b.id === badge.id)) {
                await CoderoomService.rewardEnrollee({
                    slug: slug,
                    username: username,
                    badge: badge.id
                })
            }    
        }
    }
})

AchievementEvent.on('solution', async (slug, username, submissions) => {
    const room = await CoderoomService.inspect(slug)
    const enrollee = await CoderoomService.getEnrollee(slug, username)
    const badges = await BadgeService.listBadgesBy('solution')

    if (!room || !enrollee || !badges || !submissions)
        return
    if (room.type !== CoderoomService.TYPES[0])
        return

    for (const badge of badges) {
        if (!enrollee.badges.some(b => b.id === badge.id) && submissions.length >= badge.condition) {
            await CoderoomService.rewardEnrollee({
                slug: slug,
                username: username,
                badge: badge.id
            })
        }
    }
})

AchievementEvent.on('heart', async (slug, username, submissions) => {
    const room = await CoderoomService.inspect(slug)
    const enrollee = await CoderoomService.getEnrollee(slug, username)
    const badges = await BadgeService.listBadgesBy('heart')

    if (!room || !enrollee || !badges || !submissions)
        return
    if (room.type !== CoderoomService.TYPES[0])
        return

    let heartBadgeMap = {}
    for (const badge of badges) {
        heartBadgeMap[badge.filename] = (badge.filename === "perfectionist.png" ? 5 : 1)
        const filtered = submissions.filter(subs => subs.heart.lives === heartBadgeMap[badge.filename])
        if (!enrollee.badges.some(b => b.id === badge.id) && filtered && filtered.length >= badge.condition) {
            await CoderoomService.rewardEnrollee({
                slug: slug,
                username: username,
                badge: badge.id
            })
        }
    }
})

AchievementEvent.on('streak', async (slug, username) => {
    const room = await CoderoomService.inspect(slug)
    const enrollee = await CoderoomService.getEnrollee(slug, username)
    const badges = await BadgeService.listBadgesBy('streak')

    if (!room || !enrollee || !badges)
        return
    if (room.type !== CoderoomService.TYPES[0])
        return
    
    for (const badge of badges) {
        if (enrollee.streak.highest >= badge.condition) {
            if (!enrollee.badges.some(b => b.id === badge.id)) {
                await CoderoomService.rewardEnrollee({
                    slug: slug,
                    username: username,
                    badge: badge.id
                })
            }
        }
    }
})

AchievementEvent.on('ranking', async (slug, rankings) => {
    const room = await CoderoomService.inspect(slug)
    const badges = await BadgeService.listBadgesBy('ranking')

    if (!room || !rankings || !badges)
        return
    if (room.type !== CoderoomService.TYPES[0])
        return

    for (const badge of badges) {
        for (const [i, enrollee] of rankings.entries()) {
            if (!enrollee.badges.some(b => b.id === badge.id) && i < badge.condition && enrollee.points > 0) {
                await CoderoomService.rewardEnrollee({
                    slug: room.slug,
                    username: enrollee.learner.auth.username,
                    badge: badge.id
                })
            }
        }
    }
})

AchievementEvent.on('language', async (slug, username, submissions) => {
    const room = await CoderoomService.inspect(slug)
    const enrollee = await CoderoomService.getEnrollee(slug, username)
    const badges = await BadgeService.listBadgesBy('language')

    if (!room || !enrollee || !badges || !submissions)
        return
    if (room.type !== CoderoomService.TYPES[0])
        return

    for (const badge of badges) {
        if (!enrollee.badges.some(b => b.id === badge.id) && submissions.length >= badge.condition && enrollee.points > 0) {
            await CoderoomService.rewardEnrollee({
                slug: room.slug,
                username: enrollee.learner.auth.username,
                badge: badge.id
            })
        }
    }
})

module.exports = AchievementEvent