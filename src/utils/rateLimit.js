const rateLimit = require('telegraf-ratelimit');

const limitConfig = {
  window: 3000,
  limit: 1,
  onLimitExceeded: (ctx) => {
    ctx.reply('Please wait before sending another command.');
  }
};

module.exports = rateLimit(limitConfig);