const axios = require('axios');
const config = require('../../config');
const logger = require('../utils/logger');
const { updateUserList } = require('../../db');

class MessageHandler {
  static async handleMessage(ctx) {
    try {
      const chatId = ctx.chat.id;
      const userId = ctx.from.id;
      const user = ctx.from.first_name;
      const text = ctx.message.text || ctx.message.caption || '';

      // Update user list
      await updateUserList(userId);

      const prompt = "Kamu adalah bot telegram yang diberi nama ZumyNext, pembuatmu adalah Angga a.k.a iZumy, umurnya 19 tahun, dia lulusan teknik komputer dan jaringan, dia memiliki kepribadian baik, perhatian, lucu, bertanggung jawab, dan ganteng, dia sedang mengembangkan projek bot telegram, dia berasal dari Yogyakarta, webnya adalah anggahrm.my.id";

      const waitMessage = await ctx.reply("⏳ Please wait...");

      const data = {
        content: text,
        user: user,
        prompt: prompt
      };

      if (ctx.message.photo) {
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        const fileLink = await ctx.telegram.getFileLink(photo.file_id);
        const imageResponse = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
        data.imageBuffer = Buffer.from(imageResponse.data);
      }

      const response = await axios.post('https://luminai.my.id/', data, {
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.result) {
        await ctx.telegram.editMessageText(
          chatId,
          waitMessage.message_id,
          null,
          response.data.result
        );
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      logger.error('Message handler error:', error);
      await ctx.reply('❌ An error occurred while processing your message.');
    }
  }
}

module.exports = MessageHandler;