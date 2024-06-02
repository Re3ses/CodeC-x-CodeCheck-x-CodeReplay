// TODO: 
// * handle room events []
// * autmatically register username and room id []
// * figure out how those 2 previous task work []

const { SOCKET_PORT } = require('../config')

const { UserService, LiveCodingService } = require('../services')

const { Logger } = require('../scripts')

const io = require('socket.io')(SOCKET_PORT, {
    cors: {
        origin: "*"
    }
})

var mentor
var users = []

const listen = () => {
    io.httpServer.on('listening', () => {
        console.log(`Socket Server listening at port ${io.httpServer.address().port}...`)
    })

    // TODO:
    // format user and mentor better for client side usage []
    // handle command send from mentor []
    // handle google meet link send and recieve []
    // handle real time messaging []
    io.on('connection', socket => {
        console.log(`${socket.id} connected to Socket Server!`)

        socket.on('init-server', async (room_name) => {
            socket.join(room_name);
            mentor = socket.id;
            room = room_name;
        })

        socket.on('join-room', async (username, room_name) => {
            if (!users.includes(username)) {
                socket.join(room_name);

                io.to(room_name).emit('join-success', true);

                users.push(username);

                io.to(mentor).emit('joined-users', users);

                console.log(`joined room: ${room_name}`)
            }
        })

        socket.on('update-editor', async (editor_value, room_name) => {
            io.to(room_name).emit('updated-editor', editor_value);
            console.log(`updated room (${room_name})'s editor value: ${editor_value}`)
            console.log(mentor, users)
        })

        socket.on('disconnecting', async (reason) => {
            for (const room of socket.rooms) {
                if (room !== socket.id) {
                    socket.to(room).emit("user has left", socket.id);
                    mentor = "";
                    users = [];
                    console.log(reason);
                }
            }

        })

        // NOTE:
        // value: boolean
        socket.on('freeze-all', async (value, room_name) => {
            io.to(room_name).emit('freeze', value);
        })
        socket.on('freeze-one', async (value, student_id) => {
            io.to(student_id).emit('freeze', value);
        })
        socket.on('hide-to-all', async (value, room_name) => {
            io.to(room_name).emit('hide-editor', value);
        })
        socket.on('hide-to-one', async (value, student_id) => {
            io.to(student_id).emit('hide-editor', value);
        })

        // NOTE: log active users on a liveroom and add to connectedLearners
        //socket.on('active', (username, liveroom_id) => {
        //    connectedlearners[socket.id] = {
        //        username: username,
        //        liveroom_id: liveroom_id
        //    }
        //    console.log('current connected:', username)
        //    logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-active').info(`[${username}] is active`)
        //})

        //// NOTE: Learner: join a liveroom
        //socket.on('join', async () => {
        //    const { username, liveroom_id } = connectedLearners[socket.id]
        //    const learner = await UserService.profile(username)
        //    let liveroom = await LiveCodingService.serial(liveroom_id)

        //    if (!learner || !liveroom)
        //        return

        //    liveroom = await LiveCodingService.addToSession(liveroom_id, username)

        //    socket.join(liveroom_id)
        //    socket.to(liveroom_id).emit('joined', username)

        //    if (io.sockets.adapter.rooms.get(liveroom_id).size === 1) {
        //        await LiveCodingService.liveUpdate({
        //            id: liveroom_id,
        //            test_case: liveroom.test_case,
        //            language_used: liveroom.live_session.language_used,
        //            code: liveroom.live_session.code,
        //            call_link: liveroom.live_session.call_link,
        //            editor: username
        //        })
        //    }
        //    console.log('Disconnected:', username);
        //    Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-joined').info(`[${username}] joined`)
        //})

        //// NOTE: remove learner from liveroom session
        //socket.on('disconnect', async (reason) => {
        //    const { username, liveroom_id } = connectedLearners[socket.id]
        //    const liveroom = await LiveCodingService.removeFromSession(liveroom_id, username)

        //    if (liveroom && liveroom.live_session.editor.auth.username === username) {
        //        const newEditor = (liveroom.learners.length > 0 ? liveroom.learners[0].auth.username : null)

        //        await LiveCodingService.liveUpdate({
        //            id: liveroom_id,
        //            test_case: liveroom.test_case,
        //            language_used: liveroom.live_session.language_used,
        //            code: liveroom.live_session.code,
        //            call_link: liveroom.live_session.call_link,
        //            editor: newEditor
        //        })
        //        socket.to(liveroom_id).emit('editor-disconnected', username, newEditor)
        //    } else {
        //        socket.to(liveroom_id).emit('learner-disconnected', username)
        //    }

        //    Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-exit').info(`[${username}] exited`)
        //    delete connectedLearners[socket.id]
        //})

        //// NOTE: Update on type and emit updated type
        //socket.on('update-on-type', async (code) => {
        //    const { liveroom_id } = connectedLearners[socket.id]
        //    const liveroom = await LiveCodingService.serial(liveroom_id)

        //    if (!liveroom)
        //        return

        //    await LiveCodingService.liveUpdate({
        //        id: liveroom_id,
        //        test_case: liveroom.test_case,
        //        language_used: liveroom.live_session.language_used,
        //        code: code,
        //        call_link: liveroom.live_session.call_link,
        //        editor: liveroom.live_session.editor.auth.username
        //    })

        //    Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-typed').info(`[${liveroom.live_session.editor.auth.username}] modified the code`)

        //    socket.to(liveroom_id).emit('updated-type', code)
        //})

        //// NOTE: update editor with updated type 
        //socket.on('update-editor', async (username) => {
        //    const { liveroom_id } = connectedLearners[socket.id]
        //    const liveroom = await LiveCodingService.serial(liveroom_id)

        //    if (!liveroom)
        //        return

        //    const newEditor = (liveroom.learners.some(l => l.auth.username === username) ? username : null)

        //    await LiveCodingService.liveUpdate({
        //        id: liveroom_id,
        //        test_case: liveroom.test_case,
        //        language_used: liveroom.live_session.language_used,
        //        code: liveroom.live_session.code,
        //        call_link: liveroom.live_session.call_link,
        //        editor: newEditor
        //    })

        //    Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-editor').info(`[${liveroom.live_session.editor.auth.username}] passed the editor rights`)

        //    socket.to(liveroom_id).emit('updated-editor', newEditor)
        //})

        //// NOTE: update language used
        //socket.on('update-language', async (language_used) => {
        //    const { liveroom_id } = connectedLearners[socket.id]
        //    const liveroom = await LiveCodingService.serial(liveroom_id)

        //    if (!liveroom)
        //        return

        //    await LiveCodingService.liveUpdate({
        //        id: liveroom_id,
        //        test_case: liveroom.test_case,
        //        language_used: language_used,
        //        code: liveroom.live_session.code,
        //        call_link: liveroom.live_session.call_link,
        //        editor: liveroom.live_session.editor.auth.username
        //    })

        //    Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-language').info(`[${liveroom.live_session.editor.auth.username}] changed the language to ${language_used}`)

        //    socket.to(liveroom_id).emit('updated-language', language_used)
        //})

        //// NOTE: Update testcase
        //socket.on('update-test-case', async (test_case) => {
        //    const { liveroom_id } = connectedLearners[socket.id]
        //    const liveroom = await LiveCodingService.serial(liveroom_id)

        //    if (!liveroom)
        //        return

        //    await LiveCodingService.liveUpdate({
        //        id: liveroom_id,
        //        test_case: test_case,
        //        language_used: liveroom.live_session.language_used,
        //        code: liveroom.live_session.code,
        //        call_link: liveroom.live_session.call_link,
        //        editor: liveroom.live_session.editor.auth.username
        //    })

        //    Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-test-case').info(`[${liveroom.live_session.editor.auth.username}] modified the test case`)

        //    socket.to(liveroom_id).emit('updated-test-case', test_case)
        //})

        //// NOTE: Accept compile and emit output
        //socket.on('compiled', async (output) => {
        //    const { liveroom_id } = connectedLearners[socket.id]
        //    const liveroom = await LiveCodingService.serial(liveroom_id)

        //    Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-compiled').info(`[${liveroom.live_session.editor.auth.username}] compiled the code`)

        //    socket.to(liveroom_id).emit('pass-output', output)
        //})

        //// NOTE: Accept start-call signal
        //socket.on('start-call', async (call_link) => {
        //    const { liveroom_id } = connectedLearners[socket.id]
        //    const liveroom = await LiveCodingService.serial(liveroom_id)

        //    if (!liveroom)
        //        return

        //    await LiveCodingService.liveUpdate({
        //        id: liveroom_id,
        //        test_case: liveroom.test_case,
        //        language_used: liveroom.live_session.language_used,
        //        code: liveroom.live_session.code,
        //        call_link: call_link,
        //        editor: liveroom.live_session.editor.auth.username
        //    })

        //    Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-call').info(`[${liveroom.live_session.editor.auth.username}] started a call`)

        //    socket.to(liveroom_id).emit('receive-call-link', call_link)

        //    socket.on('end-call', async () => {
        //        await LiveCodingService.liveUpdate({
        //            id: liveroom_id,
        //            test_case: liveroom.test_case,
        //            language_used: liveroom.live_session.language_used,
        //            code: liveroom.live_session.code,
        //            call_link: "",
        //            editor: liveroom.live_session.editor.auth.username
        //        })
        //        Logger.file(`live-coding/${liveroom_id}.log`, 'liveroom-call').info(`[${liveroom.live_session.editor.auth.username}] ended the call`)

        //        socket.to(liveroom_id).emit('terminate-call')
        //    })
        //})
    })
}

module.exports = {
    listen
}
