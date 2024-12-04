const { getSettingsCollection } = require('../db');
const config = require('../config');

module.exports.pmonlyHandler = async (ctx) => {
  const settingsCollection = getSettingsCollection();
  const args = ctx.message.text.split(' ');

  if (ctx.from.id.toString() !== config.ownerId) {
    return ctx.reply('Hanya pemilik bot yang dapat menggunakan perintah ini.');
  }

  if (args.length !== 2) {
    return ctx.reply('Usage: /pmonly [on|off]');
  }

  const setting = args[1].toLowerCase();
  if (setting !== 'on' && setting !== 'off') {
    return ctx.reply('Invalid option. Use /pmonly [on|off]');
  }

  await settingsCollection.updateOne(
    { setting: 'pmonly' },
    { $set: { value: setting === 'on' } },
    { upsert: true }
  );

  ctx.reply(`Private message only mode is now ${setting}`);
};

module.exports.restrictToPrivateMessages = (settingsCollection) => {
  return async (ctx, next) => {
    const pmonlySetting = await settingsCollection.findOne({ setting: 'pmonly' });
    const pmonly = pmonlySetting ? pmonlySetting.value : false;

    if (pmonly && ctx.chat.type !== 'private') {
      return;
    }

    await next();
  };
};
