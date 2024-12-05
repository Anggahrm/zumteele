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
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      messageId,
      null,
      text,
      extra
    );
  } catch (error) {
    if (error.description === "Bad Request: message can't be edited") {
      // If edit fails, send as new message
      await ctx.reply(text, extra);
      try {
        // Try to delete the original message
        await ctx.telegram.deleteMessage(ctx.chat.id, messageId);
      } catch (deleteError) {
        logger.warn('Failed to delete original message:', deleteError);
      }
    } else {
      throw error;
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
    const now = Date.now();
    // Update at most every 2 seconds
    if (now - this.lastUpdate >= 2000) {
      const progressText = `Progress: ${current}/${total}${extraInfo}`;
      await safeEditMessage(this.ctx, this.messageId, progressText);
      this.lastUpdate = now;
    }
  }
}

module.exports = {
  safeEditMessage,
  ProgressReporter
};
