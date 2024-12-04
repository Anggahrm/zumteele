const { Markup } = require('telegraf');
const { getSettingsCollection } = require('../../db');
const config = require('../../config');
const logger = require('../utils/logger');

class SettingsHandler {
  static async showSettings(ctx) {
    try {
      if (ctx.from.id.toString() !== config.ownerId) {
        await ctx.reply('⚠️ You do not have permission to access settings.');
        return;
      }

      const settingsCollection = getSettingsCollection();
      const settings = await settingsCollection.find({}).toArray();
      
      const debugMode = settings.find(s => s.setting === 'debugMode')?.value || false;
      const groupOnly = settings.find(s => s.setting === 'groupOnly')?.value || false;
      const pmOnly = settings.find(s => s.setting === 'pmonly')?.value || false;

      await ctx.reply(
        '⚙️ *Bot Settings*\n\n' +
        `Debug Mode: ${debugMode ? '✅' : '❌'}\n` +
        `Group Only: ${groupOnly ? '✅' : '❌'}\n` +
        `PM Only: ${pmOnly ? '✅' : '❌'}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback(`${debugMode ? 'Disable' : 'Enable'} Debug`, 'settings_debug'),
              Markup.button.callback(`${groupOnly ? 'Disable' : 'Enable'} Group Only`, 'settings_group')
            ],
            [
              Markup.button.callback(`${pmOnly ? 'Disable' : 'Enable'} PM Only`, 'settings_pm'),
              Markup.button.callback('Close', 'settings_close')
            ]
          ])
        }
      );
    } catch (error) {
      logger.error('Settings display error:', error);
      await ctx.reply('❌ An error occurred while displaying settings.');
    }
  }

  static async handleCallback(ctx) {
    try {
      if (ctx.from.id.toString() !== config.ownerId) {
        await ctx.answerCbQuery('⚠️ You do not have permission to change settings.');
        return;
      }

      const settingsCollection = getSettingsCollection();
      const action = ctx.callbackQuery.data.replace('settings_', '');

      if (action === 'close') {
        await ctx.deleteMessage();
        return;
      }

      const setting = {
        debug: 'debugMode',
        group: 'groupOnly',
        pm: 'pmonly'
      }[action];

      if (setting) {
        const currentSetting = await settingsCollection.findOne({ setting });
        const newValue = !currentSetting?.value;
        
        await settingsCollection.updateOne(
          { setting },
          { $set: { value: newValue } },
          { upsert: true }
        );

        await this.showSettings(ctx);
        await ctx.answerCbQuery(`${setting} has been ${newValue ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      logger.error('Settings callback error:', error);
      await ctx.answerCbQuery('❌ An error occurred while updating settings.');
    }
  }
}

module.exports = SettingsHandler;