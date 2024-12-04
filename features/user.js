const { getUsersCollection } = require('../db');

const userHandler = async (ctx) => {
  const usersCollection = getUsersCollection();
  const userId = ctx.from.id; // Use sender ID instead of chat ID
  const ownerId = '6026583608';  // Replace with the actual owner chat ID

  if (userId.toString() !== ownerId) {
    await ctx.reply('Anda tidak memiliki izin untuk menggunakan perintah ini.');
    return;
  }

  const totalUsers = await usersCollection.countDocuments();
  await ctx.reply(`Total pengguna: ${totalUsers}`);
};

module.exports = { userHandler };
