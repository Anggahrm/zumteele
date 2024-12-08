const { Markup } = require('telegraf');

class KeyboardManager {
  constructor() {
    this.userStates = new Map();
  }

  // Store user's current keyboard state
  setUserKeyboard(userId, keyboard) {
    this.userStates.set(userId, keyboard);
  }

  // Remove user's keyboard state
  removeUserKeyboard(userId) {
    this.userStates.delete(userId);
  }

  // Get keyboard markup based on chat type
  getKeyboardMarkup(keyboard, chatType = 'private') {
    if (chatType === 'private') {
      return keyboard;
    }
    // For groups, use inline keyboard to avoid keyboard conflicts between users
    return this.convertToInlineKeyboard(keyboard);
  }

  // Convert regular keyboard to inline keyboard for group chats
  convertToInlineKeyboard(keyboard) {
    if (!keyboard.reply_markup?.keyboard) return keyboard;

    const inlineButtons = keyboard.reply_markup.keyboard.map(row =>
      row.map(btn => ({
        text: btn,
        callback_data: `menu_${btn.replace(/[^a-zA-Z0-9]/g, '_')}`
      }))
    );

    return {
      reply_markup: {
        inline_keyboard: inlineButtons
      }
    };
  }

  // Get cancel button based on chat type
  getCancelButton(chatType = 'private', action = 'cancel') {
    if (chatType === 'private') {
      return Markup.keyboard([['❌ Cancel']])
        .oneTime()
        .resize();
    }
    return Markup.inlineKeyboard([[
      Markup.button.callback('❌ Cancel', `${action}_cancel`)
    ]]);
  }

  // Reset keyboard to main menu
  getMainMenuKeyboard(chatType = 'private') {
    const buttons = [
      ['🎵 Spotify', '🤖 AI Settings'],
      ['📅 Schedule', '👤 User Info'],
      ['⚙️ Settings']
    ];

    if (chatType === 'private') {
      return Markup.keyboard(buttons).resize();
    }
    
    return Markup.inlineKeyboard(
      buttons.map(row =>
        row.map(btn => ({
          text: btn,
          callback_data: `menu_${btn.replace(/[^a-zA-Z0-9]/g, '_')}`
        }))
      )
    );
  }
}

module.exports = new KeyboardManager();
