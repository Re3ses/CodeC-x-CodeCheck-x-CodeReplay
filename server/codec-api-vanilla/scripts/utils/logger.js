const { createLogger, format, transports} = require('winston')

const std = (label) => createLogger({
    "format": format.combine(
        format.label({ label: label }),
        format.timestamp({ format: "MM/DD/YYYY, hh:mm:ss A" }),
        format.align(),
        format.printf((out) => `${out.timestamp} [${out.label}] ${out.level.toUpperCase()}: ${out.message}`)
    ),
    "transports": [
        new transports.Console({
            level: 'info'
        })
    ]
})

const file = (file, label) => createLogger({
    "format": format.combine(
        format.label({ label: label }),
        format.timestamp({ format: "MM/DD/YYYY, hh:mm:ss A" }),
        format.align(),
        format.printf((out) => `${out.label} : [${out.level.toUpperCase()}] ${out.message} ["${out.timestamp}"]`)
    ),
    "transports": [
        new transports.File({
            level: 'info',
            filename: `./logs/${file}`
        })
    ]
})

module.exports = {
    std,
    file
}