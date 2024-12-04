const config = require('../config');

const executeHandler = async (ctx) => {
  const userId = ctx.from.id; // Use sender ID instead of chat ID
  
  if (userId.toString() !== config.ownerId) {
    await ctx.reply('Anda tidak memiliki izin untuk menggunakan perintah ini.');
    return;
  }

  const code = ctx.message.text.slice(9); // Get the command after '/execute '

  try {
    const func = new Function('ctx', code);
    await func(ctx);
  } catch (e) {
    await ctx.reply(`🚩 Gagal mengeksekusi kode: ${e.message}`);
  }
};

module.exports = { executeHandler };
