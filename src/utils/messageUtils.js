const logger = require('./logger');

/**
 * Safely edit a message with retry logic and fallback
 * @param {Object} ctx - Telegram context
 * @param {number} messageId - Message ID to edit
 * @param {string} text - New message text
 * @param {Object} extra - Extra options for the message
 */
async function safeEditMessage(ctx, messageId, text, extra = {}) {
  try {
    // Only check permissions in groups/supergroups
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
      const chatMember = await ctx.getChatMember(ctx.botInfo.id);
      if (!chatMember || !chatMember.can_send_messages) {
        logger.warn(`Bot lacks permission to send messages in group ${ctx.chat.id}`);
        return;
      }
    }

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      messageId,
      null,
      text,
      extra
    );
  } catch (error) {
    if (error.description?.includes('message can\'t be edited')) {
      try {
        await ctx.reply(text, extra);
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, messageId);
        } catch (deleteError) {
          logger.warn('Failed to delete original message:', deleteError);
        }
      } catch (sendError) {
        logger.error('Failed to send fallback message:', sendError);
      }
    } else {
      logger.error('Message edit error:', error);
    }
  }
}

/**
 * Send progress updates for long-running operations
 */
class ProgressReporter {
  constructor(ctx, initialMessageId) {
    this.ctx = ctx;
    this.messageId = initialMessageId;
    this.lastUpdate = Date.now();
  }

  async updateProgress(current, total, extraInfo = '') {
    try {
      const now = Date.now();
      // Update at most every 2 seconds
      if (now - this.lastUpdate >= 2000) {
        const progressText = `Progress: ${current}/${total}${extraInfo}`;
        await safeEditMessage(this.ctx, this.messageId, progressText);
        this.lastUpdate = now;
      }
    } catch (error) {
      logger.error('Progress update error:', error);
    }
  }
}

/**
 * Check if bot has required permissions in a chat
 * @param {Object} ctx - Telegram context
 * @returns {Promise<boolean>} - Whether bot has required permissions
 */
async function checkBotPermissions(ctx) {
  try {
    // Only check permissions for groups/supergroups
    if (ctx.chat.type === 'private') {
      return true;
    }
    
    const chatMember = await ctx.getChatMember(ctx.botInfo.id);
    return chatMember && chatMember.can_send_messages;
  } catch (error) {
    logger.error('Permission check error:', error);
    return false;
  }
}

module.exports = {
  safeEditMessage,
  ProgressReporter,
  checkBotPermissions
};
