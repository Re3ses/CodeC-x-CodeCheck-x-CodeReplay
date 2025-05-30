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

// Health check route
router.get('/health', (req, res) => {
    // print to console that a health check was requested.
    console.log('Health check requested')
    res.status(200).json({ status: 'ok', message: 'API is running' });
});

module.exports = router