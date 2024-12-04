const { MongoClient } = require('mongodb');
const config = require('./config');

let db = null;

async function connectToDatabase() {
  if (db) return db;
  const client = await MongoClient.connect(config.mongoDb, { useNewUrlParser: true, useUnifiedTopology: true });
  db = client.db(config.dbName);
  return db;
}

async function updateUserList(userId) {
  usersCollection = getUsersCollection();
  const userExists = await usersCollection.findOne({ userId });
  if (!userExists) {
    await usersCollection.insertOne({ userId, ai: true }); // Set AI to true by default
  }
}

function getSettingsCollection() {
  return db.collection('settings');
}

function getUsersCollection() {
  return db.collection('users');
}

function getRPGCollection() {
  return db.collection('rpg');
}

module.exports = { connectToDatabase, updateUserList, getSettingsCollection, getUsersCollection, getRPGCollection };
