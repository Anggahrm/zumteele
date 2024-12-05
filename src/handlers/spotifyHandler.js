const { Markup } = require('telegraf');
const axios = require('axios');
const config = require('../../config');
const logger = require('../utils/logger');
const { safeEditMessage } = require('../utils/messageUtils');

class SpotifyHandler {
  static waitingForInput = new Set();

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

      await safeEditMessage(
        ctx,
        messageId,
        '🎵 Select a song:',
        { reply_markup: Markup.inlineKeyboard(keyboard) }
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

  // ... rest of SpotifyHandler implementation remains the same ...
}

module.exports = SpotifyHandler;
