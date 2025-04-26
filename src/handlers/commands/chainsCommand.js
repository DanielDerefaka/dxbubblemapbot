const { SUPPORTED_CHAINS_MESSAGE } = require('../../constants/messages');
const { CHAIN_KEYBOARD } = require('../../constants/keyboards');

/**
 
 * @param {TelegramBot} bot 
 * @param {Object} msg 
 */
function chainsCommand(bot, msg) {
  const chatId = msg.chat.id;
  
  
  bot.sendMessage(chatId, SUPPORTED_CHAINS_MESSAGE, {
    parse_mode: 'Markdown',
    reply_markup: CHAIN_KEYBOARD
  });
}

module.exports = chainsCommand;