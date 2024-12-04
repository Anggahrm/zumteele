const sendLongText = async (bot, chatId, text) => {
  const maxLength = 4096;
  for (let i = 0; text.length > i; i += maxLength) {
    await bot.api.sendMessage(chatId, text.slice(i, i + maxLength));
  }
};

module.exports = {
  sendLongText,
};
