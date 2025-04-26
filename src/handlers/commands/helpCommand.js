const { HELP_MESSAGE } = require('../../constants/messages');

/**
 
 * @param {TelegramBot} bot 
 * @param {Object} msg 
 */
function helpCommand(bot, msg) {
  const chatId = msg.chat.id;
  
  
  bot.sendMessage(chatId, HELP_MESSAGE, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });
}

module.exports = helpCommand;