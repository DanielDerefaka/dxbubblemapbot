const { getTokenData } = require('../../services/bubblemapsService');
const { formatTopHolders } = require('../../utils/formatter');
const { getBackToTokenKeyboard } = require('../../constants/keyboards');
const { logger } = require('../../utils/logger');

/**

 * @param {TelegramBot} bot 
 * @param {Object} msg 
 * @param {string} address 
 * @param {string} chain
 */
async function viewHoldersCallback(bot, msg, address, chain) {
  const chatId = msg.chat.id;
  
  try {
   
    await bot.editMessageText(
      '👥 *Loading top holders data...*',
      {
        chat_id: chatId,
        message_id: msg.message_id,
        parse_mode: 'Markdown'
      }
    );
    
    
    const tokenData = await getTokenData(address, chain);
    
   
    const holdersText = formatTopHolders(tokenData);
    
   
    const keyboard = getBackToTokenKeyboard(address, chain);
    
    
    await bot.editMessageText(holdersText, {
      chat_id: chatId,
      message_id: msg.message_id,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    logger.error(`Error fetching holders data: ${error.message}`);
    
   
    await bot.editMessageText(
      '❌ Could not fetch top holders data. Please try again later.',
      {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: getBackToTokenKeyboard(address, chain)
      }
    );
  }
}

module.exports = viewHoldersCallback;