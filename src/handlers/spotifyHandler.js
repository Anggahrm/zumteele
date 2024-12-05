const { Markup } = require('telegraf');
const axios = require('axios');
const config = require('../../config');
const logger = require('../utils/logger');
const { safeEditMessage } = require('../utils/messageUtils');

class SpotifyHandler {
  static waitingForInput = new Set();

  static async handleSpotifySearch(ctx) {
    try {
      // If user clicks cancel
      if (ctx.message?.text === '❌ Cancel') {
        this.waitingForInput.delete(ctx.from.id);
        await ctx.reply('Operation cancelled.', { 
          reply_markup: Markup.keyboard([
            ['🎵 Spotify', '🤖 AI Settings'],
            ['📅 Schedule', '👤 User Info'],
            ['⚙️ Settings']
          ]).resize()
        });
        return;
      }

      // If we're waiting for input from this user
      if (this.waitingForInput.has(ctx.from.id)) {
        const query = ctx.message.text;
        this.waitingForInput.delete(ctx.from.id);
        
        const message = await ctx.reply('🔍 Searching...', { 
          reply_markup: { remove_keyboard: true }
        });

        try {
          if (query.match(/https:\/\/open.spotify.com/gi)) {
            await this.handleSpotifyUrl(ctx, query, message.message_id);
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
          await ctx.reply('Please try again or choose another option:', {
            reply_markup: Markup.keyboard([
              ['🎵 Spotify', '🤖 AI Settings'],
              ['📅 Schedule', '👤 User Info'],
              ['⚙️ Settings']
            ]).resize()
          });
        }
        return;
      }

      // Initial spotify button click
      this.waitingForInput.add(ctx.from.id);
      await ctx.reply(
        '🎵 *Spotify Search*\n\nPlease enter a song title or Spotify URL:\n\n' +
        'Examples:\n' +
        '1. `payung teduh`\n' +
        '2. `https://open.spotify.com/track/...`',
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.keyboard([['❌ Cancel']]).resize()
        }
      );
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
      const keyboard = results.map((song, index) => {
        // Extract track ID from Spotify URL
        const trackId = song.url.split('/').pop().split('?')[0];
        return [{
          text: `${index + 1}. ${song.title.substring(0, 30)}${song.title.length > 30 ? '...' : ''}`,
          callback_data: `s_${trackId}` // Shortened callback data
        }];
      });

      await safeEditMessage(
        ctx,
        messageId,
        '🎵 Select a song:',
        { 
          reply_markup: { inline_keyboard: keyboard },
          parse_mode: 'Markdown'
        }
      );

      await ctx.reply('Choose another option:', {
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

  static async handleSpotifyUrl(ctx, url, messageId) {
    try {
      const response = await axios.get(
        `${config.spotifyApiUrl}/download/spotify?url=${url}&apikey=${config.apiToken}`
      );

      if (!response.data?.result?.data) {
        throw new Error('Invalid API response');
      }

      const { title, duration, url: audioUrl } = response.data.result.data;
      
      // Create a short hash for the audio URL
      const urlHash = Buffer.from(audioUrl).toString('base64').substring(0, 32);
      
      await safeEditMessage(
        ctx,
        messageId,
        `🎵 *${title}*\n⏱ Duration: ${duration}`,
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{
              text: 'Download',
              callback_data: `d_${urlHash}` // Shortened callback data
            }]]
          }
        }
      );
    } catch (error) {
      logger.error('Spotify URL error:', error);
      throw error;
    }
  }

  static async handleCallback(ctx) {
    try {
      const data = ctx.callbackQuery.data;
      
      if (data.startsWith('s_')) {
        // Handle song selection
        const trackId = data.slice(2);
        const url = `https://open.spotify.com/track/${trackId}`;
        await ctx.answerCbQuery('Fetching song details...');
        await this.handleSpotifyUrl(ctx, url, ctx.callbackQuery.message.message_id);
      } else if (data.startsWith('d_')) {
        // Handle download
        const urlHash = data.slice(2);
        await ctx.answerCbQuery('Starting download...');
        
        // Retrieve the full URL from the API again
        const trackId = ctx.callbackQuery.message.reply_markup.inline_keyboard[0][0].callback_data.slice(2);
        const response = await axios.get(
          `${config.spotifyApiUrl}/download/spotify?url=https://open.spotify.com/track/${trackId}&apikey=${config.apiToken}`
        );
        
        if (response.data?.result?.data?.url) {
          await ctx.replyWithAudio({ url: response.data.result.data.url });
        } else {
          throw new Error('Failed to get download URL');
        }
      }
    } catch (error) {
      logger.error('Spotify callback error:', error);
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

module.exports = SpotifyHandler;
