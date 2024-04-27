const { EventEmitter } = require('events')

const { UserService, CoderoomService, ProblemService } = require('../../services')

const { Mailer } = require('../../scripts')

const EmailNotificationEvent = new EventEmitter()

const auto_email_templates = require('../../public/auto-emails.json')

// Signup
EmailNotificationEvent.on('signup', async (username) => {
    const user = await UserService.profile(username)
    const trigger = (user.type === UserService.TYPES[0] ? 'learner-signup' : 'mentor-signup')

    let receipients = user.auth.email
    let subject = auto_email_templates[trigger].subject
    let text = auto_email_templates[trigger].text

    text = text.replace(new RegExp("(<Name>)", "g"), user.first_name)
    Mailer.enqueue({ receipients, subject, text })
    Mailer.notify()
})

// Change Password
EmailNotificationEvent.on('change-password', async (username) => {
    const user = await UserService.profile(username)

    let receipients = user.auth.email
    let subject = auto_email_templates["change-password"].subject
    let text = auto_email_templates["change-password"].text

    text = text.replace(new RegExp("(<Name>)", "g"), user.first_name)
    Mailer.enqueue({ receipients, subject, text })
    Mailer.notify()
})

// New Problem
EmailNotificationEvent.on('new-problem', async (roomSlug, problemSlug) => {
    const room = await CoderoomService.inspect(roomSlug)
    const problem = await ProblemService.inspect(problemSlug)

    if (!room.enrollees || room.enrollees.length === 0)
        return

    const problemPattern = new RegExp("(<Problem-Title>)", "g")
    const learnerPattern = new RegExp("(<Name>)", "g")
    const mentorPattern = new RegExp("(<Mentor>)", "g")
    const roomPattern = new RegExp("(<Room-Name>)", "g")

    for (const enrollee of room.enrollees) {
        receipients = enrollee.learner.auth.email
        let subject = auto_email_templates["new-problem"].subject
        let text = auto_email_templates["new-problem"].text

        subject = subject.replace(problemPattern, problem.name)
        text = text
                .replace(learnerPattern, enrollee.learner.first_name)
                .replace(mentorPattern, room.mentor.first_name)
                .replace(roomPattern, room.name)
        
        Mailer.enqueue({ receipients, subject, text })
    }
    Mailer.notify()
})

module.exports = EmailNotificationEvent