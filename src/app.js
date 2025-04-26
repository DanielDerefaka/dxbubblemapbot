const TelegramBot = require('node-telegram-bot-api');
const { telegramToken } = require('./config/config');
const { handleCommand, handleMessage } = require('./handlers/commandHandler');
const { handleCallbackQuery } = require('./handlers/callbackHandler');
const { logger } = require('./utils/logger');

const bot = new TelegramBot(telegramToken, { polling: true });

bot.on('message', (msg) => {
  try {
    if (msg.text && msg.text.startsWith('/')) {
      handleCommand(bot, msg);
    } else {
      handleMessage(bot, msg);
    }
  } catch (error) {
    logger.error(`Unhandled error in message handler: ${error.message}`);
  }
});

bot.on('callback_query', (callbackQuery) => {
  try {
    handleCallbackQuery(bot, callbackQuery);
  } catch (error) {
    logger.error(`Unhandled error in callback handler: ${error.message}`);
  }
});

bot.on('polling_error', (error) => {
  logger.error(`Polling error: ${error.message}`);
});

logger.info('BubbleMaps Telegram Bot started');
logger.info(`Bot username: ${bot.getMe().then(me => me.username)}`);

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  bot.stopPolling();
  process.exit(0);
});

module.exports = bot;