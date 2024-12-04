const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { sendLongText } = require('./messaging');
const { updateUserList } = require('../db');
const { sendDebugMessage } = require('./middleware');

const messageHandler = async (bot, ctx, settingsCollection, usersCollection) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const user = ctx.from.first_name;
  let text = ctx.message.text || ctx.message.caption || "Tidak ada teks";

  // Call the updateUserList function
  await updateUserList(userId);

  const userRecord = await usersCollection.findOne({ userId });
  if (!userRecord || !userRecord.ai) {
    return; // Don't respond if AI mode is off
  }

  const perintah = "Kamu adalah bot telegram yang diberi nama ZumyNext, pembuatmu adalah Angga a.k.a iZumy, umurnya 19 tahun, dia lulusan teknik komputer dan jaringan, dia memiliki kepribadian baik, perhatian, lucu, bertanggung jawab, dan ganteng, dia sedang mengembangkan projek bot telegram, dia berasal dari Yogyakarta, webnya adalah anggahrm.my.id";

  try {
    const waitMessage = await bot.api.sendMessage(chatId, "⏳ Please wait...");

    const data = { content: text, user: user, prompt: perintah };

    if (ctx.message.photo) {
      const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      const photoPath = await bot.api.getFile(photoId);
      
      // Download path yang lebih aman
      const downloadDir = path.join(__dirname, 'downloads');
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir);
      }
      
      const localPath = path.join(downloadDir, path.basename(photoPath.file_path));
      const fileStream = fs.createWriteStream(localPath);
      const fileUrl = `https://api.telegram.org/file/bot${config.botToken}/${photoPath.file_path}`;
      
      const response = await axios.get(fileUrl, { responseType: 'stream' });
      response.data.pipe(fileStream);

      fileStream.on('finish', async () => {
        const imageBuffer = fs.readFileSync(localPath);
        data.imageBuffer = imageBuffer;

        await sendDebugMessage(bot, chatId, `Sending request with photo:\nData: ${JSON.stringify({...data, imageBuffer: 'IMAGE_BUFFER'}, null, 2)}\nImage buffer size: ${imageBuffer.length} bytes`, settingsCollection);

        // Hapus file setelah digunakan
        fs.unlinkSync(localPath);

        // Kirim data ke server
        const apiResponse = await axios.post('https://luminai.my.id/', data, {
          headers: {
            'Authorization': `Bearer ${config.apiToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (apiResponse.status === 200) {
          const result = apiResponse.data.result;
          if (result.length > 4096) {
            sendLongText(bot, chatId, result);
          } else {
            await bot.api.editMessageText(chatId, waitMessage.message_id, result);
          }
        } else {
          const errorMessage = `Terjadi kesalahan saat menghubungi API. Status code: ${apiResponse.status}\nResponse: ${JSON.stringify(apiResponse.data).slice(0, 1000)}`;
          await bot.api.editMessageText(chatId, waitMessage.message_id, errorMessage);
        }
      });

      fileStream.on('error', async (error) => {
        await bot.api.sendMessage(chatId, `*Error*: \`${error.message}\``);
        await sendDebugMessage(bot, chatId, `Exception occurred: ${error.stack}`, settingsCollection);
      });
    } else {
      await sendDebugMessage(bot, chatId, `Sending request without photo:\nData: ${JSON.stringify(data, null, 2)}`, settingsCollection);

      const response = await axios.post('https://luminai.my.id/', data, {
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        const result = response.data.result;
        if (result.length > 4096) {
          sendLongText(bot, chatId, result);
        } else {
          await bot.api.editMessageText(chatId, waitMessage.message_id, result);
        }
      } else {
        const errorMessage = `Terjadi kesalahan saat menghubungi API. Status code: ${response.status}\nResponse: ${JSON.stringify(response.data).slice(0, 1000)}`;
        await bot.api.editMessageText(chatId, waitMessage.message_id, errorMessage);
      }
    }
    
  } catch (error) {
    await bot.api.sendMessage(chatId, `*Error*: \`${error.message}\``);
    await sendDebugMessage(bot, chatId, `Exception occurred: ${error.stack}`, settingsCollection);
  }
};

module.exports = {
  messageHandler,
};
