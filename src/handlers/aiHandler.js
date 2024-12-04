const { Markup } = require('telegraf');
const { getUsersCollection } = require('../../db');
const logger = require('../utils/logger');

class AIHandler {
  static async toggleAI(ctx) {
    const usersCollection = getUsersCollection();
    const userId = ctx.from.id;
    const command = ctx.match ? ctx.match[1] : null;

    try {
      if (command === 'on') {
        await usersCollection.updateOne(
          { userId }, 
          { $set: { ai: true } }, 
          { upsert: true }
        );
        await ctx.editMessageText('🤖 AI mode activated', Markup.inlineKeyboard([
          [Markup.button.callback('Turn OFF AI', 'ai_off')]
        ]));
      } else if (command === 'off') {
        await usersCollection.updateOne(
          { userId }, 
          { $set: { ai: false } }, 
          { upsert: true }
        );
        await ctx.editMessageText('🤖 AI mode deactivated', Markup.inlineKeyboard([
          [Markup.button.callback('Turn ON AI', 'ai_on')]
        ]));
      } else {
        const user = await usersCollection.findOne({ userId });
        const currentStatus = user?.ai ? 'ON' : 'OFF';
        await ctx.reply(`🤖 AI Settings\n\nCurrent status: ${currentStatus}`, Markup.inlineKeyboard([
          [Markup.button.callback(`Turn ${currentStatus === 'ON' ? 'OFF' : 'ON'} AI`, `ai_${currentStatus === 'ON' ? 'off' : 'on'}`)]
        ]));
      }
    } catch (error) {
      logger.error('AI handler error:', error);
      await ctx.reply('❌ An error occurred while updating AI settings.');
    }
  }
}

module.exports = AIHandler;