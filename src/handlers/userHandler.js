const { Markup } = require('telegraf');
const { getUsersCollection } = require('../../db');
const { isOwner } = require('../utils/ownerCheck');
const logger = require('../utils/logger');
const { safeEditMessage, ProgressReporter } = require('../utils/messageUtils');

class UserHandler {
  static waitingForBroadcast = new Set();

  static async handleBroadcast(ctx) {
    try {
      if (!isOwner(ctx.from.id)) {
        await ctx.reply('⚠️ You do not have permission to broadcast messages.', {
          reply_markup: Markup.keyboard([
            ['🎵 Spotify', '🤖 AI Settings'],
            ['📅 Schedule', '👤 User Info'],
            ['⚙️ Settings']
          ]).resize()
        });
        return;
      }

      if (ctx.message.text === '❌ Cancel Broadcast') {
        this.waitingForBroadcast.delete(ctx.from.id);
        await ctx.reply('Broadcast cancelled.', {
          reply_markup: Markup.keyboard([
            ['🎵 Spotify', '🤖 AI Settings'],
            ['📅 Schedule', '👤 User Info'],
            ['⚙️ Settings']
          ]).resize()
        });
        return;
      }

      if (!this.waitingForBroadcast.has(ctx.from.id)) {
        return;
      }

      const message = ctx.message.text;
      this.waitingForBroadcast.delete(ctx.from.id);

      const usersCollection = getUsersCollection();
      const users = await usersCollection.find().toArray();
      let successCount = 0;
      let failureCount = 0;

      const status = await ctx.reply('📣 Broadcasting message...', { 
        reply_markup: { remove_keyboard: true }
      });

      const progress = new ProgressReporter(ctx, status.message_id);

      for (const user of users) {
        try {
          await ctx.telegram.sendMessage(user.userId, message);
          successCount++;
          await progress.updateProgress(
            successCount + failureCount,
            users.length,
            `\n✅ Success: ${successCount}\n❌ Failed: ${failureCount}`
          );
        } catch (error) {
          failureCount++;
          logger.error(`Failed to send message to user ${user.userId}:`, error);
        }
      }

      // Send final status as new message
      await ctx.reply(
        `📣 Broadcast completed!\n\n` +
        `Total users: ${users.length}\n` +
        `✅ Successful: ${successCount}\n` +
        `❌ Failed: ${failureCount}`
      );

      await ctx.reply('Choose another option:', {
        reply_markup: Markup.keyboard([
          ['🎵 Spotify', '🤖 AI Settings'],
          ['📅 Schedule', '👤 User Info'],
          ['⚙️ Settings']
        ]).resize()
      });
    } catch (error) {
      logger.error('Broadcast error:', error);
      this.waitingForBroadcast.delete(ctx.from.id);
      await ctx.reply('❌ An error occurred while broadcasting the message.', {
        reply_markup: Markup.keyboard([
          ['🎵 Spotify', '🤖 AI Settings'],
          ['📅 Schedule', '👤 User Info'],
          ['⚙️ Settings']
        ]).resize()
      });
    }
  }

  // ... rest of UserHandler implementation remains the same ...
}

module.exports = UserHandler;
