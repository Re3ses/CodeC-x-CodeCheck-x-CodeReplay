const mongoose = require('mongoose')
const { MONGODB_URI } = require('../../config')

const connect = () => {
    console.log('Attempting to connect to MongoDB...', MONGODB_URI);
    mongoose.set('strictQuery', true);
    mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => {
        console.log('Connected to MongoDB successfully!');
    }).catch((err) => {
        console.error('Failed to connect to MongoDB:', err.message);
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connect, 5000); // Retry connection after 5 seconds
    });
}

module.exports = {
    connect
}