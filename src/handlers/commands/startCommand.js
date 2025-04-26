
const { START_MESSAGE } = require('../../constants/messages');

/**

 * @param {TelegramBot} bot 
 * @param {Object} msg 
 */
function startCommand(bot, msg) {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'there';
  

  const personalizedMessage = START_MESSAGE.replace('!', `, ${firstName}!`);
  
 
  bot.sendMessage(chatId, personalizedMessage, {
    parse_mode: 'Markdown',
  });
}

module.exports = startCommand;