// Wrapper module
const router = require('express').Router()

// Coderoom-related routes
router.use('/rooms', require('./coderoom/coderoom'))
router.use('/gps', require('./coderoom/group-progress'))
router.use('/liverooms', require('./coderoom/live-coding'))
router.use('/problems', require('./coderoom/problem'))
// User-related routes
router.use('/badges', require('./user/badge'))
router.use('/hearts', require('./user/heart'))
router.use('/saves', require('./user/save'))
router.use('/subs', require('./user/submission'))
router.use('/users', require('./user/user'))
// External-related routes
router.use('/attempts', require('./external/attempt-tracker'))

module.exports = router