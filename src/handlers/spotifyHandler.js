const { Markup } = require('telegraf');
const axios = require('axios');
const config = require('../../config');
const logger = require('../utils/logger');
const { safeEditMessage } = require('../utils/messageUtils');

class SpotifyHandler {
  static waitingForInput = new Set();

  static async handleSpotifySearch(ctx) {
    try {
      // Initial spotify button click or cancel
      if (!this.waitingForInput.has(ctx.from.id)) {
        this.waitingForInput.add(ctx.from.id);
        return await ctx.reply(
          '🎵 *Spotify Search*\n\nPlease enter a song title or Spotify URL:\n\n' +
          'Examples:\n' +
          '1. `payung teduh`\n' +
          '2. `https://open.spotify.com/track/...`',
          {
            parse_mode: 'Markdown',
            reply_markup: {
              keyboard: [['❌ Cancel']],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          }
        );
      }

      // Handle cancel
      if (ctx.message?.text === '❌ Cancel') {
        this.waitingForInput.delete(ctx.from.id);
        return await ctx.reply('Operation cancelled.', { 
          reply_markup: Markup.keyboard([
            ['🎵 Spotify', '🤖 AI Settings'],
            ['📅 Schedule', '👤 User Info'],
            ['⚙️ Settings']
          ]).resize()
        });
      }

      // Process search query
      const query = ctx.message.text;
      this.waitingForInput.delete(ctx.from.id);
      
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
        
        // Show main menu only on error
        await ctx.reply('Please try again:', {
          reply_markup: Markup.keyboard([
            ['🎵 Spotify', '🤖 AI Settings'],
            ['📅 Schedule', '👤 User Info'],
            ['⚙️ Settings']
          ]).resize()
        });
      }
    } catch (error) {
      logger.error('Spotify handler error:', error);
      this.waitingForInput.delete(ctx.from.id);
      await ctx.reply('❌ An error occurred. Please try again.', {
        reply_markup: Markup.keyboard([
          ['🎵 Spotify', '🤖 AI Settings'],
          ['📅 Schedule', '👤 User Info'],
          ['⚙️ Settings']
        ]).resize()
      });
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

      // Show main menu after displaying search results
      await ctx.reply('Main Menu:', {
        reply_markup: Markup.keyboard([
          ['🎵 Spotify', '🤖 AI Settings'],
          ['📅 Schedule', '👤 User Info'],
          ['⚙️ Settings']
        ]).resize()
      });
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

      // Show main menu after successful download
      await ctx.reply('Main Menu:', {
        reply_markup: Markup.keyboard([
          ['🎵 Spotify', '🤖 AI Settings'],
          ['📅 Schedule', '👤 User Info'],
          ['⚙️ Settings']
        ]).resize()
      });
    } catch (error) {
      logger.error('Spotify URL error:', error);
      throw error;
    }
  }

  static async handleCallback(ctx) {
    try {
      const data = ctx.callbackQuery.data;
      
      if (data.startsWith('spotify_')) {
        const url = data.replace('spotify_', '');
        await ctx.answerCbQuery('⬇️ Starting download...');
        await this.handleSpotifyUrl(ctx, url);
      }
    } catch (error) {
      logger.error('Spotify callback error:', error);
      await ctx.answerCbQuery('❌ An error occurred. Please try again.');
    }
  }
}

module.exports = SpotifyHandler;
