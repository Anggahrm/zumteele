const { InputFile } = require('grammy');
const fetch = require("node-fetch");
const apiToken = 'zumyXD';

const spotifyHandler = async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (!args[0]) {
    await ctx.reply('🚩 Masukkan URL atau judul lagu!\n\nExample:\n/spotify https://open.spotify.com/track/3zakx7RAwdkUQlOoQ7SJRt\n\nExample:\n/spotify payung teduh');
    return;
  }

  const waitMessage = await ctx.reply('⏳ Please wait...');

  if (args[0].match(/https:\/\/open.spotify.com/gi)) {
    try {
      const res = await fetch(`https://api.betabotz.eu.org/api/download/spotify?url=${args[0]}&apikey=${apiToken}`);
      let jsons = await res.json();
      if (!jsons.result || !jsons.result.data) {
        throw new Error('Invalid API response');
      }
      const { thumbnail, title, name, duration, url } = jsons.result.data;
      const { id, type } = jsons.result.data.artist;
      let captionvid = ` ∘ Title: ${title}\n∘ Id: ${id}\n∘ Duration: ${duration}\n∘ Type: ${type}`;
      await ctx.api.editMessageText(ctx.chat.id, waitMessage.message_id, captionvid);
      await ctx.replyWithAudio(new InputFile({ url: url }), { title: title });
    } catch (e) {
      await ctx.api.editMessageText(ctx.chat.id, waitMessage.message_id, `🚩 ${e.message}`);
    }
  } else {
    const text = args.join(" ");
    try {
      const api = await fetch(`https://api.betabotz.eu.org/api/search/spotify?query=${text}&apikey=${apiToken}`);
      let json = await api.json();
      let res = json.result.data;

      const topResults = res.slice(0, 5);
      const buttons = topResults.map((item, index) => ({
        text: `${index + 1}. ${item.title}`,
        callback_data: `spotify_${item.url}`
      }));

      await ctx.api.editMessageText(ctx.chat.id, waitMessage.message_id, "Choose a song:", {
        reply_markup: {
          inline_keyboard: buttons.map(button => [button])
        }
      });
    } catch (error) {
      console.error(error);
      await ctx.reply("An error occurred while fetching the data.");
    }
  }
};

const spotifyCallbackHandler = async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (data.startsWith('spotify_')) {
    const url = data.replace('spotify_', '');
    try {
      const res = await fetch(`https://api.betabotz.eu.org/api/download/spotify?url=${url}&apikey=${apiToken}`);
      let jsons = await res.json();
      if (!jsons.result || !jsons.result.data) {
        throw new Error('Invalid API response');
      }
      const { title, url: audioUrl } = jsons.result.data;
      await ctx.replyWithAudio(new InputFile({ url: audioUrl }), { title: title });
    } catch (e) {
      await ctx.reply(`🚩 Server Down!`);
    }
  }
};

module.exports = { spotifyHandler, spotifyCallbackHandler };
