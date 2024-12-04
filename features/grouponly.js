const config = require('../config');
const { getSettingsCollection } = require('../db');

const groupOnlyHandler = async (ctx) => {
  const settingsCollection = getSettingsCollection();
  const userId = ctx.from.id; // Use sender ID instead of chat ID
  
  if (userId.toString() !== config.ownerId) {
    await ctx.reply('Anda tidak memiliki izin untuk menggunakan perintah ini.');
    return;
  }

  const command = ctx.message.text.split(' ')[1];  // Get 'on' or 'off'

  if (command === 'on') {
    await settingsCollection.updateOne({ setting: "groupOnly" }, { $set: { value: true } }, { upsert: true });
    await ctx.reply('Group-only mode activated.');
  } else if (command === 'off') {
    await settingsCollection.updateOne({ setting: "groupOnly" }, { $set: { value: false } }, { upsert: true });
    await ctx.reply('Group-only mode deactivated.');
  } else {
    await ctx.reply('Use /grouponly on or /grouponly off to control group-only mode.');
  }
};

module.exports = { groupOnlyHandler };
