const logger = require('./logger');

const limitConfig = {
  window: 3000,
  limit: 1,
  onLimitExceeded: async (ctx) => {
    try {
      // Check if bot has permission to send messages
      const chatMember = await ctx.getChatMember(ctx.botInfo.id);
      if (!chatMember || !chatMember.can_send_messages) {
        logger.warn(`Bot lacks permission to send messages in chat ${ctx.chat.id}`);
        return;
      }
      
      await ctx.reply('Please wait before sending another command.');
    } catch (error) {
      // Log the error but don't crash the bot
      logger.error('Rate limit handler error:', error);
    }
  }
};

const rateLimit = (ctx, next) => {
  const now = Date.now();
  const userId = ctx.from?.id;
  
  if (!userId) return next();

  const userKey = `${userId}:${ctx.chat.id}`;
  const windowStart = now - limitConfig.window;
  
  // Initialize or clean up user's message history
  if (!global.userMessages) global.userMessages = {};
  if (!global.userMessages[userKey]) global.userMessages[userKey] = [];
  
  // Remove old messages outside the current window
  global.userMessages[userKey] = global.userMessages[userKey].filter(
    time => time > windowStart
  );
  
  // Check if user has exceeded rate limit
  if (global.userMessages[userKey].length >= limitConfig.limit) {
    limitConfig.onLimitExceeded(ctx);
    return;
  }
  
  // Add current message timestamp
  global.userMessages[userKey].push(now);
  return next();
};

module.exports = rateLimit;
