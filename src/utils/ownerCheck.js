const config = require('../../config');

/**
 * Utility function to check if a user is the bot owner
 * @param {string} userId - The user ID to check
 * @returns {boolean} - True if the user is the owner, false otherwise
 */
const isOwner = (userId) => {
  return userId?.toString() === config.ownerId;
};

module.exports = { isOwner };
