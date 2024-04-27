const { SOCKET_PORT } = require('../config')

const { UserService, LiveCodingService } = require('../services')

const { Logger } = require('../scripts')

const io = require('socket.io')(SOCKET_PORT, {
    cors: {
        origin: "*"
    }
})

var connectedLearners = {}

const listen = () => {
    io.httpServer.on('listening', () => {
        console.log(`Socket Server listening at port ${io.httpServer.address().port}...`)
    })

    io.on('connection', socket => {
        console.log(`${socket.id} connected to Socket Server!`)

        socket.on('active', (username, liveroom_id) => {
            connectedLearners[socket.id] = {
                username: username,
                liveroom_id: liveroom_id
            }
            console.log('Current connected:', username)
            Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-active').info(`[${username}] is active`)
        })

        socket.on('join', async () => {
            const { username, liveroom_id } = connectedLearners[socket.id]
            const learner = await UserService.profile(username)
            let liveroom = await LiveCodingService.serial(liveroom_id)

            if (!learner || !liveroom)
                return
            
            liveroom = await LiveCodingService.addToSession(liveroom_id, username)  

            socket.join(liveroom_id)
            socket.to(liveroom_id).emit('joined', username)
            
            if (io.sockets.adapter.rooms.get(liveroom_id).size === 1) {
                await LiveCodingService.liveUpdate({
                    id: liveroom_id,
                    test_case: liveroom.test_case,
                    language_used: liveroom.live_session.language_used,
                    code: liveroom.live_session.code,
                    call_link: liveroom.live_session.call_link,
                    editor: username
                })
            }
            console.log('Disconnected:', username);
            Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-joined').info(`[${username}] joined`)
        })

        socket.on('disconnect', async (reason) => {
            const { username, liveroom_id } = connectedLearners[socket.id]
            const liveroom = await LiveCodingService.removeFromSession(liveroom_id, username)

            if (liveroom && liveroom.live_session.editor.auth.username === username) {
                const newEditor = (liveroom.learners.length > 0 ? liveroom.learners[0].auth.username : null)

                await LiveCodingService.liveUpdate({
                    id: liveroom_id,
                    test_case: liveroom.test_case,
                    language_used: liveroom.live_session.language_used,
                    code: liveroom.live_session.code,
                    call_link: liveroom.live_session.call_link,
                    editor: newEditor
                })
                socket.to(liveroom_id).emit('editor-disconnected', username, newEditor)
            } else {
                socket.to(liveroom_id).emit('learner-disconnected', username)
            }

            Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-exit').info(`[${username}] exited`)
            delete connectedLearners[socket.id]
        })

        socket.on('update-on-type', async (code) => {
            const { liveroom_id } = connectedLearners[socket.id]
            const liveroom = await LiveCodingService.serial(liveroom_id)

            if (!liveroom)
                return

            await LiveCodingService.liveUpdate({
                id: liveroom_id,
                test_case: liveroom.test_case,
                language_used: liveroom.live_session.language_used,
                code: code,
                call_link: liveroom.live_session.call_link,
                editor: liveroom.live_session.editor.auth.username
            })

            Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-typed').info(`[${liveroom.live_session.editor.auth.username}] modified the code`)

            socket.to(liveroom_id).emit('updated-type', code)
        })

        socket.on('update-editor', async (username) => {
            const { liveroom_id } = connectedLearners[socket.id]
            const liveroom = await LiveCodingService.serial(liveroom_id)

            if (!liveroom)
                return

            const newEditor = (liveroom.learners.some(l => l.auth.username === username) ? username : null)

            await LiveCodingService.liveUpdate({
                id: liveroom_id,
                test_case: liveroom.test_case,
                language_used: liveroom.live_session.language_used,
                code: liveroom.live_session.code,
                call_link: liveroom.live_session.call_link,
                editor: newEditor
            })

            Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-editor').info(`[${liveroom.live_session.editor.auth.username}] passed the editor rights`)

            socket.to(liveroom_id).emit('updated-editor', newEditor)
        })

        socket.on('update-language', async (language_used) => {
            const { liveroom_id } = connectedLearners[socket.id]
            const liveroom = await LiveCodingService.serial(liveroom_id)

            if (!liveroom)
                return

            await LiveCodingService.liveUpdate({
                id: liveroom_id,
                test_case: liveroom.test_case,
                language_used: language_used,
                code: liveroom.live_session.code,
                call_link: liveroom.live_session.call_link,
                editor: liveroom.live_session.editor.auth.username
            })

            Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-language').info(`[${liveroom.live_session.editor.auth.username}] changed the language to ${language_used}`)

            socket.to(liveroom_id).emit('updated-language', language_used)
        })

        socket.on('update-test-case', async (test_case) => {
            const { liveroom_id } = connectedLearners[socket.id]
            const liveroom = await LiveCodingService.serial(liveroom_id)

            if (!liveroom)
                return

            await LiveCodingService.liveUpdate({
                id: liveroom_id,
                test_case: test_case,
                language_used: liveroom.live_session.language_used,
                code: liveroom.live_session.code,
                call_link: liveroom.live_session.call_link,
                editor: liveroom.live_session.editor.auth.username
            })

            Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-test-case').info(`[${liveroom.live_session.editor.auth.username}] modified the test case`)

            socket.to(liveroom_id).emit('updated-test-case', test_case)
        })

        socket.on('compiled', async (output) => {
            const { liveroom_id } = connectedLearners[socket.id]
            const liveroom = await LiveCodingService.serial(liveroom_id)

            Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-compiled').info(`[${liveroom.live_session.editor.auth.username}] compiled the code`)

            socket.to(liveroom_id).emit('pass-output', output)
        })

        socket.on('start-call', async (call_link) => {
            const { liveroom_id } = connectedLearners[socket.id]
            const liveroom = await LiveCodingService.serial(liveroom_id)

            if (!liveroom)
                return

            await LiveCodingService.liveUpdate({
                id: liveroom_id,
                test_case: liveroom.test_case,
                language_used: liveroom.live_session.language_used,
                code: liveroom.live_session.code,
                call_link: call_link,
                editor: liveroom.live_session.editor.auth.username
            })

            Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-call').info(`[${liveroom.live_session.editor.auth.username}] started a call`)

            socket.to(liveroom_id).emit('receive-call-link', call_link)

            socket.on('end-call', async () => {
                await LiveCodingService.liveUpdate({
                    id: liveroom_id,
                    test_case: liveroom.test_case,
                    language_used: liveroom.live_session.language_used,
                    code: liveroom.live_session.code,
                    call_link: "",
                    editor: liveroom.live_session.editor.auth.username
                })
                Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-call').info(`[${liveroom.live_session.editor.auth.username}] ended the call`)

                socket.to(liveroom_id).emit('terminate-call')
            })
        })
    })
}

module.exports = {
    listen
}