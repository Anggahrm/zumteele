const { Markup } = require('telegraf');
const axios = require('axios');
const config = require('../../config');
const logger = require('../utils/logger');
const { safeEditMessage } = require('../utils/messageUtils');
const keyboardManager = require('../utils/keyboardManager');

class SpotifyHandler {
  static waitingForInput = new Map();

  static async handleSpotifySearch(ctx) {
    try {
      const userId = ctx.from.id;
      const chatType = ctx.chat.type;

      // Handle cancel action
      if (ctx.message?.text === '❌ Cancel' || (ctx.callbackQuery?.data === 'spotify_cancel')) {
        this.waitingForInput.delete(userId);
        await this.handleCancel(ctx);
        return;
      }

      // Initial spotify button click
      if (!this.waitingForInput.has(userId)) {
        this.waitingForInput.set(userId, true);
        const message = '🎵 *Spotify Search*\n\nPlease enter a song title or Spotify URL:\n\n' +
                       'Examples:\n' +
                       '1. `payung teduh`\n' +
                       '2. `https://open.spotify.com/track/...`';

        const keyboard = keyboardManager.getCancelButton(chatType, 'spotify');
        
        if (ctx.callbackQuery) {
          await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            ...keyboard
          });
        } else {
          await ctx.reply(message, {
            parse_mode: 'Markdown',
            ...keyboard
          });
        }
        return;
      }

      // Process search query
      const query = ctx.message.text;
      this.waitingForInput.delete(userId);
      
      const message = await ctx.reply('🔍 Searching...', { 
        reply_markup: { remove_keyboard: true }
      });

      try {
        if (query.match(/https:\/\/open.spotify.com/gi)) {
          await this.handleSpotifyUrl(ctx, query);
        } else {
          await this.handleSpotifyQuery(ctx, query, message.message_id);
        }
      } catch (error) {
        logger.error('Spotify search processing error:', error);
        await safeEditMessage(
          ctx,
          message.message_id,
          '❌ An error occurred while processing your request.'
        );
        
        await this.showMainMenu(ctx);
      }
    } catch (error) {
      logger.error('Spotify handler error:', error);
      this.waitingForInput.delete(ctx.from.id);
      await this.showMainMenu(ctx);
    }
  }

  static async handleSpotifyQuery(ctx, query, messageId) {
    try {
      const response = await axios.get(
        `${config.spotifyApiUrl}/search/spotify?query=${encodeURIComponent(query)}&apikey=${config.apiToken}`
      );

      if (!response.data?.result?.data) {
        throw new Error('Invalid API response');
      }

      const results = response.data.result.data.slice(0, 5);
      
      const keyboard = results.map(song => [{
        text: song.title.substring(0, 30) + (song.title.length > 30 ? '...' : ''),
        callback_data: `spotify_${song.url}`
      }]);

      await safeEditMessage(
        ctx,
        messageId,
        '🎵 Select a song to download:',
        { 
          reply_markup: { inline_keyboard: keyboard }
        }
      );

      await this.showMainMenu(ctx);
    } catch (error) {
      logger.error('Spotify query error:', error);
      throw error;
    }
  }

  static async handleSpotifyUrl(ctx, url) {
    try {
      const waitMessage = await ctx.reply('⏳ Downloading song...');
      
      const response = await axios.get(
        `${config.spotifyApiUrl}/download/spotify?url=${encodeURIComponent(url)}&apikey=${config.apiToken}`
      );

      if (!response.data?.result?.data) {
        throw new Error('Invalid API response');
      }

      const { title, url: audioUrl } = response.data.result.data;

      await ctx.replyWithAudio({ url: audioUrl }, { title });
      await ctx.deleteMessage(waitMessage.message_id);

      await this.showMainMenu(ctx);
    } catch (error) {
      logger.error('Spotify URL error:', error);
      throw error;
    }
  }

  static async handleCallback(ctx) {
    try {
      const data = ctx.callbackQuery.data;
      
      if (data === 'spotify_cancel') {
        await this.handleCancel(ctx);
      } else if (data.startsWith('spotify_')) {
        const url = data.replace('spotify_', '');
        await ctx.answerCbQuery('⬇️ Starting download...');
        await this.handleSpotifyUrl(ctx, url);
      }
    } catch (error) {
      logger.error('Spotify callback error:', error);
      await ctx.answerCbQuery('❌ An error occurred. Please try again.');
      await this.showMainMenu(ctx);
    }
  }

  static async handleCancel(ctx) {
    const chatType = ctx.chat.type;
    if (ctx.callbackQuery) {
      await ctx.editMessageText('Operation cancelled.');
    } else {
      await ctx.reply('Operation cancelled.');
    }
    await this.showMainMenu(ctx);
  }

  static async showMainMenu(ctx) {
    const chatType = ctx.chat.type;
    const keyboard = keyboardManager.getMainMenuKeyboard(chatType);
    await ctx.reply('Choose an option:', keyboard);
  }
}

module.exports = SpotifyHandler;
