module.exports.sendDebugMessage = async (bot, chatId, message, settingsCollection) => {
  const debugModeSetting = await settingsCollection.findOne({ setting: "debugMode" });
  const debugMode = debugModeSetting ? debugModeSetting.value : false;

  if (!debugMode) return;  // Cek apakah debugMode aktif
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
    const chatId = ctx.chat.id;
    const groupOnlySetting = await settingsCollection.findOne({ setting: "groupOnly" });
    const groupOnly = groupOnlySetting ? groupOnlySetting.value : false;

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
      const logGroupId = '-4532293862'; // Replace with your logging group ID
      try {
        await ctx.forwardMessage(logGroupId);
      } catch (error) {
        console.error(`Failed to forward message: ${error.message}`);
      }
    }

    await next();
  };
};
