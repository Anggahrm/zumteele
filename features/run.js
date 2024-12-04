const { exec } = require('child_process');

const runHandler = async (ctx) => {
  const userId = ctx.from.id; // Use sender ID instead of chat ID
  const ownerId = '6026583608';  // Replace with the actual owner chat ID

  if (userId.toString() !== ownerId) {
    await ctx.reply('Anda tidak memiliki izin untuk menggunakan perintah ini.');
    return;
  }
  const command = ctx.message.text.slice(5); // Get the command after '/run '

  exec(command, async (error, stdout, stderr) => {
    if (error) {
      await ctx.reply(`*Error*: \`${error.message}\``);
      return;
    }
    if (stderr) {
      await ctx.reply(`*stderr*: \`${stderr}\``);
      return;
    }
    const result = `stdout: \`${stdout}\``;
    if (result.length > 4096) {
      await sendLongText(ctx.chat.id, result);
    } else {
      await ctx.reply(result);
    }
  });
};

module.exports = { runHandler };
