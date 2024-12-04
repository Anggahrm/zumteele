const { getUsersCollection } = require('../db');
const aiHandler = async (ctx) => {
  const usersCollection = getUsersCollection();
  const userId = ctx.from.id;
  const command = ctx.message.text.split(' ')[1];  // Get 'on' or 'off'

  if (command === 'on') {
    await usersCollection.updateOne({ userId }, { $set: { ai: true } }, { upsert: true });
    await ctx.reply('AI mode activated.');
  } else if (command === 'off') {
    await usersCollection.updateOne({ userId }, { $set: { ai: false } }, { upsert: true });
    await ctx.reply('AI mode deactivated.');
  } else {
    await ctx.reply('Use /ai on or /ai off to control AI mode.');
  }
};

module.exports = { aiHandler };
