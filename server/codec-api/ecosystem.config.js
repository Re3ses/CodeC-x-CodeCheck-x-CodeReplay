module.exports = {
    apps: [{
        name: "codec-server-m",
        script: "./server.js",
        autorestart: false,
        exec_mode: "fork",
        instances: 1
    }, {
        name: "codec-server-1",
        script: "./apps/api.js",
        autorestart: false,
        exec_mode: "fork",
        instances: 1,
        env: {
            API_PORT: 8001
        }
    }, {
        name: "codec-server-2",
        script: "./apps/api.js",
        autorestart: false,
        exec_mode: "fork",
        instances: 1,
        env: {
            API_PORT: 8002
        }
    }, {
        name: "codec-server-3",
        script: "./apps/api.js",
        autorestart: false,
        exec_mode: "fork",
        instances: 1,
        env: {
            API_PORT: 8003
        }
    }, {
        name: "codec-server-4",
        script: "./apps/api.js",
        autorestart: false,
        exec_mode: "fork",
        instances: 1,
        env: {
            API_PORT: 8004
        }
    }]
}