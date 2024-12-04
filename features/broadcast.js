const config = require('../config');

const broadcastHandler = async (ctx) => {
  const usersCollection = getUsersCollection();
  const userId = ctx.from.id; // Use sender ID instead of chat ID

  if (userId.toString() !== config.ownerId) {
    await ctx.reply('Anda tidak memiliki izin untuk menggunakan perintah ini.');
    return;
  }

  const message = ctx.message.text.slice(11); // Get the message after '/broadcast '
  const users = await usersCollection.find().toArray();

  let totalUsers = users.length;
  let successCount = 0;
  let failureCount = 0;

  // Send the message to each user
  for (const user of users) {
    try {
      await ctx.api.sendMessage(user.userId, message);
      successCount++;
    } catch (error) {
      console.error(`Failed to send message to user ${user.userId}: ${error.message}`);
      failureCount++;
    }
  }

  // Send a summary message to the owner
  await ctx.api.sendMessage(ctx.chat.id, `Pesan telah dikirim ke semua pengguna. Total pengguna: ${totalUsers}, Berhasil terkirim: ${successCount}, Gagal terkirim: ${failureCount}.`);
};

module.exports = { broadcastHandler };
