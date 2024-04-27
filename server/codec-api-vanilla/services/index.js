// Wrapper module
module.exports = {
    // Coderoom-related services
    CoderoomService: require('./coderoom/coderoom'),
    GroupProgressService: require('./coderoom/group-progress'),
    LiveCodingService: require('./coderoom/live-coding'),
    ProblemService: require('./coderoom/problem'),
    // User-related services
    BadgeService: require('./user/badge'),
    HeartService: require('./user/heart'),
    SaveService: require('./user/save'),
    SubmissionService: require('./user/submission'),
    UserService: require('./user/user'),
    // External services
    AttemptTrackerService: require('./external/attempt-tracker')
}