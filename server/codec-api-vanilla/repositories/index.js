// Wrapper module
module.exports = {
    // Coderoom-related repositories
    CoderoomRepository: require('./coderoom/coderoom'),
    GroupProgressRepository: require('./coderoom/group-progress'),
    LiveCodingRepository: require('./coderoom/live-coding'),
    ProblemRepository: require('./coderoom/problem'),
    // User-related repositories
    BadgeRepository: require('./user/badge'),
    HeartRepository: require('./user/heart'),
    SaveRepository: require('./user/save'),
    SubmissionRepository: require('./user/submission'),
    UserRepository: require('./user/user'),
    // External Repositories
    AttemptTrackerRepository: require('./external/attempt-tracker')
}