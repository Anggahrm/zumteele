const config = require('../config');
const { getSettingsCollection } = require('../db');

const debugHandler = async (ctx) => {
  const settingsCollection = getSettingsCollection();
  const userId = ctx.from.id; // Use sender ID instead of chat ID

  if (userId.toString() !== config.ownerId) {
    await ctx.reply('Anda tidak memiliki izin untuk menggunakan perintah ini.');
    return;
  }
  const command = ctx.message.text.split(' ')[1];  // Get 'on' or 'off'

  if (command === 'on') {
    await settingsCollection.updateOne({ setting: "debugMode" }, { $set: { value: true } }, { upsert: true });
    await ctx.reply('Mode debug diaktifkan.');
  } else if (command === 'off') {
    await settingsCollection.updateOne({ setting: "debugMode" }, { $set: { value: false } }, { upsert: true });
    await ctx.reply('Mode debug dinonaktifkan.');
  } else {
    await ctx.reply('Gunakan /debug on atau /debug off untuk mengontrol mode debug.');
  }
};

module.exports = { debugHandler };
