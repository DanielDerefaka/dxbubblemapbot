


const { EXAMPLE_TOKEN_MESSAGE } = require('../../constants/messages');
const { getExampleTokensKeyboard } = require('../../constants/keyboards');
const { getChainById } = require('../../constants/chains');

/**
 * @param {TelegramBot} bot 
 * @param {Object} msg 
 * @param {string} chainId 
 */
async function chainSelectCallback(bot, msg, chainId) {
  const chatId = msg.chat.id;
  

  const chain = getChainById(chainId);
  

  const keyboard = getExampleTokensKeyboard(chainId);
  

  const message = EXAMPLE_TOKEN_MESSAGE(chain);
  

  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: msg.message_id,
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
}

module.exports = chainSelectCallback;