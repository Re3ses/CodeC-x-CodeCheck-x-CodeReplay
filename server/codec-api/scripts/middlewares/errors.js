class APIError extends Error {
    constructor(message, code) {
        super(message)
        this.name = this.constructor.name
        this.code = code

        Error.captureStackTrace(this, this.constructor)
    }
}

class DocumentNotFoundError extends APIError {
    constructor(message) {
        super(message, 404)
        this.name = this.constructor.name

        Error.captureStackTrace(this, this.constructor)
    }
}

const wrapper = (middleware) => async (req, res, next) => {
    try {
        await middleware(req, res)
    } catch (err) {
        next(err)
    }
}

const handler = (err, req, res, next) => {
    if (err instanceof ReferenceError || err instanceof TypeError)
        err = new APIError(err.message, 500)

    res.status(err.code).json({ error: err, message: err.message })
}

module.exports.handler = (err, req, res, next) => {
    console.error(err);  // Log error for debugging
    const statusCode = err.status || 500;  // Default to 500 if no status
    res.status(statusCode).json({ error: err.message || "Internal Server Error" });
};