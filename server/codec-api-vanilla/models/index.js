// Wrapper module
module.exports = {
    // Coderoom-related models
    Coderoom: require('./coderoom/coderoom'),
    GroupProgress: require('./coderoom/group-progress'),
    LiveCoding: require('./coderoom/live-coding'),
    Problem: require('./coderoom/problem'),
    // User-related models
    Badge: require('./user/badge'),
    Heart: require('./user/heart'),
    Save: require('./user/save'),
    Submission: require('./user/submission'),
    User: require('./user/user'),
    // External models
    AttemptTracker: require('./external/attempt-tracker')
}