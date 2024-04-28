const nodemailer = require('nodemailer')

const { MAILER_USERNAME, MAILER_PASSWORD } = require('../../config')

const Logger = require('./logger')

const transporter = nodemailer.createTransport({
    service: "gmail",
    pool: true,
    auth: {
        user: MAILER_USERNAME,
        pass: MAILER_PASSWORD
    }
})

// Pool
var pendings = []

// Listener
transporter.on('idle', () => {
    setTimeout(async () => {
        while (transporter.isIdle() && pendings.length > 0) {
            const mail = pendings.pop()

            const info = await transporter.sendMail(mail)
            Logger.std('email').info(info.response)
        }
    }, 2000)
})

const enqueue = ({ receipients, subject, text }) => {
    const mail = {
        from: MAILER_USERNAME,
        to: receipients,
        subject: subject,
        text: text
    }
    pendings.push(mail)
}

const notify = () => transporter.emit('idle')

module.exports = {
    enqueue,
    notify
}