const mongoose = require('mongoose');

const connectToDatabase = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to', process.env.MONGODB_URI);

    // Delete all data from your collections
    await mongoose.connection.db.dropDatabase();
    console.log('All data deleted');
};

const closeDatabaseConnection = async () => {
    // Delete all data from your collections
    await mongoose.connection.db.dropDatabase();
    console.log('All data deleted');
  
    // Close the database connection
    await mongoose.connection.close();
    console.log('Connection closed');
  };

module.exports = { connectToDatabase, closeDatabaseConnection };