const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
require('dotenv').config();

const { connectToDatabase } = require('./db');
const config = require('./config');
const logger = require('./src/utils/logger');
const rateLimit = require('./src/utils/rateLimit');
const keyboardManager = require('./src/utils/keyboardManager');

// Import handlers
const SpotifyHandler = require('./src/handlers/spotifyHandler');
const AIHandler = require('./src/handlers/aiHandler');
const ScheduleHandler = require('./src/handlers/scheduleHandler');
const SettingsHandler = require('./src/handlers/settingsHandler');
const UserHandler = require('./src/handlers/userHandler');
const MessageHandler = require('./src/handlers/messageHandler');

// Import middleware
const { restrictToGroups, logMessages } = require('./features/middleware');

const bot = new Telegraf(config.botToken);

// Initialize database connection
let settingsCollection;
(async () => {
  const db = await connectToDatabase();
  settingsCollection = db.collection('settings');
})();

// Middleware
bot.use(rateLimit);
bot.use((ctx, next) => logMessages(settingsCollection)(ctx, next));
bot.use((ctx, next) => restrictToGroups(settingsCollection)(ctx, next));

// Start command
bot.command('start', async (ctx) => {
  const chatType = ctx.chat.type;
  const keyboard = keyboardManager.getMainMenuKeyboard(chatType);
  
  await ctx.reply(
    `Welcome ${ctx.from.first_name}! 👋\n\nI'm ZumyNext, your personal assistant bot. Choose an option from the menu below:`,
    keyboard
  );
});

// Handle menu callbacks for group chats
bot.action(/menu_(.+)/, async (ctx) => {
  const action = ctx.match[1];
  const handler = {
    'Spotify': () => SpotifyHandler.handleSpotifySearch(ctx),
    'AI_Settings': () => AIHandler.toggleAI(ctx),
    'Schedule': () => ScheduleHandler.showSchedule(ctx),
    'User_Info': () => UserHandler.showUserInfo(ctx),
    'Settings': () => SettingsHandler.showSettings(ctx)
  }[action];

  if (handler) {
    await handler();
  }
});

// Main menu handlers
bot.hears('🎵 Spotify', (ctx) => SpotifyHandler.handleSpotifySearch(ctx));
bot.hears('🤖 AI Settings', (ctx) => AIHandler.toggleAI(ctx));
bot.hears('📅 Schedule', (ctx) => ScheduleHandler.showSchedule(ctx));
bot.hears('👤 User Info', (ctx) => UserHandler.showUserInfo(ctx));
bot.hears('⚙️ Settings', (ctx) => SettingsHandler.showSettings(ctx));

// Handle schedule day selection
bot.hears(/^📅 (Minggu|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu)$/, (ctx) => ScheduleHandler.handleDaySelection(ctx));
bot.hears('🔙 Main Menu', (ctx) => {
  const keyboard = keyboardManager.getMainMenuKeyboard(ctx.chat.type);
  ctx.reply('Main Menu:', keyboard);
});

// Handle cancel buttons
bot.hears('❌ Cancel', (ctx) => SpotifyHandler.handleSpotifySearch(ctx));
bot.action('spotify_cancel', (ctx) => SpotifyHandler.handleSpotifySearch(ctx));

// Callback queries
bot.action(/spotify_.*/, (ctx) => SpotifyHandler.handleCallback(ctx));
bot.action(/download_.*/, (ctx) => SpotifyHandler.handleCallback(ctx));
bot.action(/ai_(on|off)/, (ctx) => AIHandler.toggleAI(ctx));
bot.action(/schedule_.*/, (ctx) => ScheduleHandler.handleDaySelection(ctx));
bot.action(/settings_.*/, (ctx) => SettingsHandler.handleCallback(ctx));
bot.action(/user_.*/, (ctx) => UserHandler.handleCallback(ctx));

// Message handler for AI responses and waiting inputs
bot.on(message('text'), async (ctx) => {
  try {
    // Check if waiting for Spotify input
    if (SpotifyHandler.waitingForInput.has(ctx.from.id)) {
      await SpotifyHandler.handleSpotifySearch(ctx);
      return;
    }

    // Check if waiting for broadcast message
    if (UserHandler.waitingForBroadcast.has(ctx.from.id)) {
      await UserHandler.handleBroadcast(ctx);
      return;
    }

    // Handle AI responses
    const usersCollection = await (await connectToDatabase()).collection('users');
    const user = await usersCollection.findOne({ userId: ctx.from.id });
    
    if (user?.ai) {
      await MessageHandler.handleMessage(ctx);
    }
  } catch (error) {
    logger.error('Message handling error:', error);
  }
});

// Error handling
bot.catch((err, ctx) => {
  logger.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('An error occurred while processing your request.');
});

// Start the bot
async function startBot() {
  try {
    await connectToDatabase();
    logger.info('Connected to MongoDB');
    
    await bot.launch();
    logger.info('ZumyNext bot started successfully');
    
    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    logger.error('Failed to start the bot:', error);
    process.exit(1);
  }
}

startBot();
