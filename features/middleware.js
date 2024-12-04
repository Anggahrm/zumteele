const config = require('../config');

module.exports.sendDebugMessage = async (bot, chatId, message, settingsCollection) => {
  const debugModeSetting = await settingsCollection.findOne({ setting: "debugMode" });
  const debugMode = debugModeSetting ? debugModeSetting.value : false;

  if (!debugMode) return;  // Check if debugMode is active
  const maxLength = 4096;
  const messages = [];
  for (let i = 0; message.length > i; i += maxLength) {
    messages.push(message.slice(i, i + maxLength));
  }
  for (const msg of messages) {
    await bot.api.sendMessage(chatId, `DEBUG: ${msg}`);
  }
};

module.exports.restrictToGroups = (settingsCollection) => {
  return async (ctx, next) => {
    const userId = ctx.from?.id?.toString();
    const chatId = ctx.chat?.id;
    const groupOnlySetting = await settingsCollection.findOne({ setting: "groupOnly" });
    const groupOnly = groupOnlySetting ? groupOnlySetting.value : false;

    // Allow owner to bypass group-only restriction
    if (userId === config.ownerId) {
      await next();
      return;
    }

    // Check group-only mode for other users
    if (groupOnly && (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup')) {
      await ctx.reply('Bot ini hanya dapat digunakan di grup. Bergabunglah ke grup Zumy Discussion: https://t.me/zumydc.');
      return;
    }

    await next();
  };
};

// Middleware to log all messages and commands
module.exports.logMessages = (settingsCollection) => {
  return async (ctx, next) => {
    const logsSetting = await settingsCollection.findOne({ setting: "loggingEnabled" });
    const loggingEnabled = logsSetting ? logsSetting.value : false;

    if (loggingEnabled && ctx.message) {
      const logGroupId = config.logGroupId;
      try {
        await ctx.forwardMessage(logGroupId);
      } catch (error) {
        console.error(`Failed to forward message: ${error.message}`);
      }
    }

    await next();
  };
};
