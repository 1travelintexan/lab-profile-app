const MONGO_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1/profile-app-server';

module.exports = MONGO_URI;
