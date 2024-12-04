require('dotenv').config();

module.exports = {
  // Bot Configuration
  botToken: process.env.BOT_TOKEN || '6373447466:AAG54mWfzfN-RHwJkqG7PosjCtY-0l-CRcw',
  ownerId: process.env.OWNER_ID || '6026583608',
  apiToken: process.env.API_TOKEN || 'zumyXD',
  
  // MongoDB Configuration
  mongoDb: process.env.MONGODB_URI || 'mongodb+srv://zumydc:zumydc@zumydc.mos64tk.mongodb.net/?retryWrites=true&w=majority&appName=ZumyDC',
  
  // Group Configuration
  allowedGroups: ['group_id_1', 'group_id_2'],
  logGroupId: '-4532293862',
  
  // API Configuration
  spotifyApiUrl: process.env.SPOTIFY_API_URL || 'https://api.betabotz.eu.org/api',
  
  // Rate Limiting
  rateLimit: {
    window: 3000,
    limit: 1
  }
};
