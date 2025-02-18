// Wrapper module

module.exports = {
    AchievementEmitter: require('./achievement/achievement'),
    EmailNotificationEmitter: require('./notification/email'),
    GroupProgressEmitter: require('./tracker/group-progress')
}