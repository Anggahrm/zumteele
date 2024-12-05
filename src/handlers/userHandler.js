const { Markup } = require('telegraf');
const { getUsersCollection } = require('../../db');
const { isOwner } = require('../utils/ownerCheck');
const logger = require('../utils/logger');
const { safeEditMessage, ProgressReporter } = require('../utils/messageUtils');

class UserHandler {
  static waitingForBroadcast = new Set();

  static async showUserInfo(ctx) {
    try {
      const usersCollection = getUsersCollection();
      const totalUsers = await usersCollection.countDocuments();
      const activeUsers = await usersCollection.countDocuments({ ai: true });
      
      if (isOwner(ctx.from.id)) {
        await ctx.reply(
          '👥 *User Statistics*\n\n' +
          `Total Users: ${totalUsers}\n` +
          `Active AI Users: ${activeUsers}`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('Broadcast Message', 'user_broadcast')],
              [Markup.button.callback('Close', 'user_close')]
            ])
          }
        );
      } else {
        const user = await usersCollection.findOne({ userId: ctx.from.id });
        await ctx.reply(
          '👤 *Your Profile*\n\n' +
          `User ID: \`${ctx.from.id}\`\n` +
          `AI Mode: ${user?.ai ? '✅' : '❌'}`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback(`${user?.ai ? 'Disable' : 'Enable'} AI`, `ai_${user?.ai ? 'off' : 'on'}`)]
            ])
          }
        );
      }
    } catch (error) {
      logger.error('User info error:', error);
      await ctx.reply('❌ An error occurred while fetching user information.', {
        reply_markup: Markup.keyboard([
          ['🎵 Spotify', '🤖 AI Settings'],
          ['📅 Schedule', '👤 User Info'],
          ['⚙️ Settings']
        ]).resize()
      });
    }
  }

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

  static async handleCallback(ctx) {
    try {
      const action = ctx.callbackQuery.data.replace('user_', '');
      
      if (action === 'close') {
        await ctx.deleteMessage();
      } else if (action === 'broadcast' && isOwner(ctx.from.id)) {
        this.waitingForBroadcast.add(ctx.from.id);
        await ctx.reply(
          '📣 Please enter your broadcast message:',
          {
            reply_markup: Markup.keyboard([['❌ Cancel Broadcast']])
              .oneTime()
              .resize()
          }
        );
      }
      
      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('User callback error:', error);
      await ctx.answerCbQuery('❌ An error occurred. Please try again.');
      await ctx.reply('Please try again or choose another option:', {
        reply_markup: Markup.keyboard([
          ['🎵 Spotify', '🤖 AI Settings'],
          ['📅 Schedule', '👤 User Info'],
          ['⚙️ Settings']
        ]).resize()
      });
    }
  }
}

module.exports = UserHandler;
