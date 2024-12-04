const checkIdHandler = async (ctx) => {
  const chatId = ctx.chat.id;
  await ctx.api.sendMessage(chatId, `Chat ID: \`${chatId}\``);
};

module.exports = { checkIdHandler };
