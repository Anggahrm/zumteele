const { Markup } = require('telegraf');

const mainMenuKeyboard = Markup.keyboard([
  ['🎵 Spotify', '🤖 AI Settings'],
  ['📅 Schedule', '👤 User Info'],
  ['⚙️ Settings']
]).resize();

const aiSettingsKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('Turn ON AI', 'ai_on'),
    Markup.button.callback('Turn OFF AI', 'ai_off')
  ]
]);

const settingsKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('Debug Mode', 'settings_debug'),
    Markup.button.callback('Group Only', 'settings_group')
  ],
  [
    Markup.button.callback('PM Only', 'settings_pm'),
    Markup.button.callback('Back', 'settings_back')
  ]
]);

module.exports = {
  mainMenuKeyboard,
  aiSettingsKeyboard,
  settingsKeyboard
};