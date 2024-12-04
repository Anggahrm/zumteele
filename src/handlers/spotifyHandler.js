const { Markup } = require('telegraf');
const axios = require('axios');
const config = require('../../config');
const logger = require('../utils/logger');

class SpotifyHandler {
  static waitingForInput = new Set();

  static async handleSpotifySearch(ctx) {
    try {
      // If user clicks cancel
      if (ctx.message?.text === '❌ Cancel') {
        this.waitingForInput.delete(ctx.from.id);
        await ctx.reply('Operation cancelled.', { 
          reply_markup: { remove_keyboard: true },
          ...Markup.keyboard([
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
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            message.message_id,
            null,
            '❌ An error occurred while processing your request.'
          );
          // Restore main menu keyboard
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
          reply_markup: Markup.keyboard([['❌ Cancel']])
            .oneTime()
            .resize()
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

  static async handleSpotifyUrl(ctx, url, messageId) {
    try {
      const response = await axios.get(
        `${config.spotifyApiUrl}/download/spotify?url=${url}&apikey=${config.apiToken}`
      );

      if (!response.data?.result?.data) {
        throw new Error('Invalid API response');
      }

      const { title, duration, url: audioUrl } = response.data.result.data;
      
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        messageId,
        null,
        `🎵 *${title}*\n⏱ Duration: ${duration}`,
        { 
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('Download', `spotify_download_${audioUrl}`)]
          ])
        }
      );

      // Restore main menu keyboard
      await ctx.reply('Choose another option:', {
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

  static async handleSpotifyQuery(ctx, query, messageId) {
    try {
      const response = await axios.get(
        `${config.spotifyApiUrl}/search/spotify?query=${encodeURIComponent(query)}&apikey=${config.apiToken}`
      );

      if (!response.data?.result?.data) {
        throw new Error('Invalid API response');
      }

      const results = response.data.result.data.slice(0, 5);
      const keyboard = results.map((song, index) => ([
        Markup.button.callback(
          `${index + 1}. ${song.title.substring(0, 30)}${song.title.length > 30 ? '...' : ''}`,
          `spotify_url_${song.url}`
        )
      ]));

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        messageId,
        null,
        '🎵 Select a song:',
        { reply_markup: Markup.inlineKeyboard(keyboard) }
      );

      // Restore main menu keyboard
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

  static async handleCallback(ctx) {
    try {
      const data = ctx.callbackQuery.data;
      
      if (data.startsWith('spotify_url_')) {
        const url = data.replace('spotify_url_', '');
        await ctx.answerCbQuery('Fetching song details...');
        await this.handleSpotifyUrl(ctx, url, ctx.callbackQuery.message.message_id);
      } else if (data.startsWith('spotify_download_')) {
        const url = data.replace('spotify_download_', '');
        await ctx.answerCbQuery('Starting download...');
        await ctx.replyWithAudio({ url });
      }
    } catch (error) {
      logger.error('Spotify callback error:', error);
      await ctx.answerCbQuery('❌ An error occurred. Please try again.');
      // Restore main menu keyboard
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
